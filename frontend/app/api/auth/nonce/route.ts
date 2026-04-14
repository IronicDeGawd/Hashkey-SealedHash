import { generateSiweNonce } from "viem/siwe";
import { getSession } from "@/lib/session";

// Mint a one-time challenge and bind it to the session cookie. The client
// wraps this value into a SIWE message, signs it, and posts it to /verify.
// The nonce is cleared on successful verification so it cannot be replayed.
export async function GET() {
  const session = await getSession();
  const nonce = generateSiweNonce();
  session.nonce = nonce;
  await session.save();
  return Response.json({ nonce });
}
