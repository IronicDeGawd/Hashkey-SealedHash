import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { nonceBackups, profiles } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

type NonceBackupBody = {
  ciphertext: string; // base64
  iv: string; // base64
  ad: string; // base64
};

// Sanity cap. The plaintext is a tiny JSON object with two bigint strings;
// any ciphertext larger than this is an obvious abuse signal. 4096 is the
// ceiling the plan specifies.
const MAX_CIPHERTEXT_BYTES = 4096;
const IV_BYTES = 12;

function decodeBase64(value: unknown, max: number): Buffer | null {
  if (typeof value !== "string") return null;
  let buf: Buffer;
  try {
    buf = Buffer.from(value, "base64");
  } catch {
    return null;
  }
  if (buf.length === 0 || buf.length > max) return null;
  return buf;
}

// PUT /api/nonces/:scope — upsert a single encrypted backup. Treat body as
// opaque bytes: no JSON.parse on the ciphertext, no base64-then-inspect, no
// peek at anything. If the row is new the profile is autocreated so the FK
// holds without forcing the UI to PUT the profile first.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ scope: string }> },
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { scope: rawScope } = await params;
  const scope = decodeURIComponent(rawScope);
  if (!scope || scope.length > 256) {
    return new Response("invalid scope", { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("invalid body", { status: 400 });
  }
  if (typeof raw !== "object" || raw === null) {
    return new Response("invalid body", { status: 400 });
  }
  const body = raw as Partial<NonceBackupBody>;
  // Reject unknown keys — no silent acceptance.
  for (const k of Object.keys(body)) {
    if (!["ciphertext", "iv", "ad"].includes(k)) {
      return new Response("invalid body", { status: 400 });
    }
  }

  const ciphertext = decodeBase64(body.ciphertext, MAX_CIPHERTEXT_BYTES);
  const iv = decodeBase64(body.iv, IV_BYTES);
  const ad = decodeBase64(body.ad, 512);
  if (!ciphertext || !iv || iv.length !== IV_BYTES || !ad) {
    return new Response("invalid body", { status: 400 });
  }

  // Autocreate the profile shell so the FK always holds, without forcing the
  // caller to separately PUT /api/profile first.
  await db
    .insert(profiles)
    .values({ address: session.address! })
    .onConflictDoNothing({ target: profiles.address });

  await db
    .insert(nonceBackups)
    .values({
      address: session.address!,
      scope,
      ciphertext,
      iv,
      ad,
    })
    .onConflictDoUpdate({
      target: [nonceBackups.address, nonceBackups.scope],
      set: { ciphertext, iv, ad, createdAt: new Date() },
    });

  return new Response(null, { status: 204 });
}

// DELETE /api/nonces/:scope — post-reveal cleanup. Only the owning wallet
// can delete its own rows.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scope: string }> },
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { scope: rawScope } = await params;
  const scope = decodeURIComponent(rawScope);

  await db
    .delete(nonceBackups)
    .where(
      and(eq(nonceBackups.address, session.address!), eq(nonceBackups.scope, scope)),
    );

  return new Response(null, { status: 204 });
}
