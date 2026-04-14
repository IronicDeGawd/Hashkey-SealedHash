import type { Address } from "viem";
import { createSiweMessage } from "viem/siwe";
import { hashkeyTestnet } from "./chain";
import { clearBackupKey } from "./crypto/backup-key";
import { migrateLocalNonces, resetMigrationFlag, type MigrationResult } from "./migration/local-to-backup";

type SignMessage = (message: string) => Promise<`0x${string}`>;

export type SignInResult = {
  address: Address;
  migration: MigrationResult;
};

// Full SIWE handshake: fetch a server-bound nonce, build the message the
// server expects, have the wallet sign it, submit to /verify. On success the
// session cookie is set and subsequent calls to /api/auth/me return the
// address until /api/auth/logout is called.
//
// Immediately after verify, the one-shot localStorage → encrypted backup
// migration runs so existing users carry their in-flight nonces up to the
// backend on their first sign-in. The result is returned so the caller can
// show a toast ("backed up N saved bids") without re-running the migration.
export async function signIn(
  address: Address,
  signMessage: SignMessage,
): Promise<SignInResult> {
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

  // Migration failures are non-fatal — the sign-in itself succeeded, so
  // we return rather than throwing. The caller decides how to surface it.
  let migration: MigrationResult;
  try {
    migration = await migrateLocalNonces(address, signMessage);
  } catch (err) {
    console.warn("[auth] migration skipped due to error:", err);
    migration = { ran: false, migrated: 0, failed: 0, skippedOther: 0 };
  }

  return { address, migration };
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  // Drop the derived key and the per-session migration flag so a subsequent
  // sign-in with a different wallet in the same tab re-runs cleanly.
  clearBackupKey();
  resetMigrationFlag();
}

export async function getMe(): Promise<Address | null> {
  const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { address: Address | null };
  return data.address;
}
