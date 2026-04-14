// One-shot migration: walk every localStorage nonce belonging to the
// signed-in wallet, encrypt each under the backup key, and PUT it to the
// backup endpoint. Local copies are NOT deleted on success — they remain
// the fast path and the offline fallback.
//
// Only entries whose scope key ends with `:${address.toLowerCase()}` are
// touched. A wallet signing in as A must never accidentally encrypt wallet
// B's nonces under wallet A's key.
//
// Gated by a sessionStorage flag so the migration runs at most once per
// tab after a successful sign-in. Re-running is safe (the server upsert
// is idempotent) but avoids the wallet prompt spam.

import { getBackupKey } from "../crypto/backup-key";
import { bytesToBase64, encryptNonce } from "../crypto/nonce-vault";
import { putNonceBackup } from "../api/nonce-backup";

const STORAGE_KEY = "hashkey-sealed-bid-v1";
const MIGRATED_FLAG = "sealedhash:migrated";

type SignMessage = (message: string) => Promise<`0x${string}`>;

type NonceRecord = {
  bid: string;
  nonce: string;
  committedAt: number;
};

export type MigrationResult = {
  ran: boolean;
  migrated: number;
  failed: number;
  skippedOther: number;
};

/// Idempotent migration. Returns `ran: false` if the session-flag is set
/// or there is nothing to migrate, so callers can decide whether to show
/// a toast.
export async function migrateLocalNonces(
  address: `0x${string}`,
  signMessage: SignMessage,
): Promise<MigrationResult> {
  if (typeof window === "undefined") {
    return { ran: false, migrated: 0, failed: 0, skippedOther: 0 };
  }
  if (window.sessionStorage.getItem(MIGRATED_FLAG)) {
    return { ran: false, migrated: 0, failed: 0, skippedOther: 0 };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.sessionStorage.setItem(MIGRATED_FLAG, "1");
    return { ran: true, migrated: 0, failed: 0, skippedOther: 0 };
  }

  let store: Record<string, NonceRecord>;
  try {
    store = JSON.parse(raw) as Record<string, NonceRecord>;
  } catch {
    window.sessionStorage.setItem(MIGRATED_FLAG, "1");
    return { ran: true, migrated: 0, failed: 0, skippedOther: 0 };
  }

  const lowerAddr = address.toLowerCase();
  const mine: Array<[string, NonceRecord]> = [];
  let skippedOther = 0;
  for (const [scope, rec] of Object.entries(store)) {
    // scope shape: `${chainId}:${auction}:${auctionId}:${bidder}` with
    // bidder already lowercased at save time.
    if (scope.endsWith(":" + lowerAddr)) mine.push([scope, rec]);
    else skippedOther++;
  }

  if (mine.length === 0) {
    window.sessionStorage.setItem(MIGRATED_FLAG, "1");
    return { ran: true, migrated: 0, failed: 0, skippedOther };
  }

  // Derive once. `getBackupKey` caches, so every encryptNonce call below
  // reuses the same AES-GCM key without another wallet prompt.
  let key: CryptoKey;
  try {
    key = await getBackupKey(address, signMessage);
  } catch (err) {
    console.warn("[migration] backup key derivation failed:", err);
    // Do NOT set the flag on failure — the next sign-in should retry.
    return { ran: true, migrated: 0, failed: mine.length, skippedOther };
  }

  let migrated = 0;
  let failed = 0;
  for (const [scope, rec] of mine) {
    try {
      const enc = await encryptNonce(key, scope, {
        bid: BigInt(rec.bid),
        nonce: BigInt(rec.nonce),
      });
      await putNonceBackup(scope, {
        ciphertext: bytesToBase64(enc.ciphertext),
        iv: bytesToBase64(enc.iv),
        ad: bytesToBase64(enc.ad),
      });
      migrated++;
    } catch (err) {
      console.warn(`[migration] failed for scope=${scope}:`, err);
      failed++;
    }
  }

  // Flag set only after a full pass so a partial network failure re-tries
  // on the next sign-in rather than silently dropping entries.
  if (failed === 0) {
    window.sessionStorage.setItem(MIGRATED_FLAG, "1");
  }

  return { ran: true, migrated, failed, skippedOther };
}

/// Clear the per-session flag. Call on sign-out so a new sign-in in the
/// same tab (different wallet) re-migrates its own entries.
export function resetMigrationFlag(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(MIGRATED_FLAG);
}
