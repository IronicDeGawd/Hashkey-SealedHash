import type { NextRequest } from "next/server";
import type { Hex } from "viem";
import { parseSiweMessage } from "viem/siwe";
import { getSession } from "@/lib/session";
import { publicClient } from "@/lib/chain";

type VerifyBody = {
  message: string;
  signature: Hex;
};

// Accept a SIWE message + signature, verify it against the pending nonce in
// the session cookie, and promote the session to authenticated. On any
// failure we return a single canonical 401 so the client cannot probe which
// step failed.
export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session.nonce) {
    return new Response("no pending nonce", { status: 401 });
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  if (typeof body.message !== "string" || typeof body.signature !== "string") {
    return new Response("invalid body", { status: 400 });
  }

  const parsed = parseSiweMessage(body.message);
  if (!parsed.address) {
    return new Response("invalid siwe message", { status: 400 });
  }

  // Host from the same request so a cross-origin caller cannot replay a
  // signature that was minted for a different domain.
  const host = req.headers.get("host") ?? undefined;

  const verified = await publicClient.verifySiweMessage({
    message: body.message,
    signature: body.signature,
    nonce: session.nonce,
    address: parsed.address,
    domain: host,
    time: new Date(),
  });

  if (!verified) {
    return new Response("unauthorized", { status: 401 });
  }

  session.address = parsed.address;
  // Clear the nonce so the same (message, signature) pair cannot be
  // replayed against a future request.
  session.nonce = undefined;
  await session.save();

  return Response.json({ ok: true, address: parsed.address });
}
