import type { Address } from "viem";
import { createSiweMessage } from "viem/siwe";
import { hashkeyTestnet } from "./chain";

type SignMessage = (message: string) => Promise<`0x${string}`>;

// Full SIWE handshake: fetch a server-bound nonce, build the message the
// server expects, have the wallet sign it, submit to /verify. On success the
// session cookie is set and subsequent calls to /api/auth/me return the
// address until /api/auth/logout is called.
export async function signIn(address: Address, signMessage: SignMessage): Promise<void> {
  const nonceRes = await fetch("/api/auth/nonce", { method: "GET", credentials: "include" });
  if (!nonceRes.ok) throw new Error("nonce fetch failed");
  const { nonce } = (await nonceRes.json()) as { nonce: string };

  const message = createSiweMessage({
    address,
    chainId: hashkeyTestnet.id,
    domain: window.location.host,
    uri: window.location.origin,
    nonce,
    version: "1",
    // Human-readable statement stored in the signed payload so the wallet
    // prompt shows intent clearly.
    statement: "Sign in to SealedHash. This signature does not authorize any transaction.",
    issuedAt: new Date(),
  });

  const signature = await signMessage(message);

  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  if (!verifyRes.ok) throw new Error("siwe verification failed");
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function getMe(): Promise<Address | null> {
  const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { address: Address | null };
  return data.address;
}
