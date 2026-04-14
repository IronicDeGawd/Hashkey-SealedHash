// Browser-side backup key derivation.
//
// The backup key is derived from an RFC 6979 deterministic wallet signature
// so the same wallet recovers the same key on any device without storing
// anything server-side. The signed message is a fixed string binding the
// key to the wallet address — changing the string breaks recovery, so
// treat it as schema and never edit it once users have saved nonces under
// the current value.
//
// Security invariants (any violation is a critical bug):
//   * The raw signature never leaves the browser. Never fetch, never log.
//   * APP_SALT is an app-wide constant. Randomizing it changes the derived
//     key and orphans every existing backup.
//   * The derived AES-GCM key is marked non-extractable; consumers cannot
//     export it.
//   * The key is cached in sessionStorage's in-memory map only — we do NOT
//     persist the raw CryptoKey or the signature to any web-storage surface.
//     This keeps a disk image of the browser profile free of long-lived
//     key material.

type SignMessage = (message: string) => Promise<`0x${string}`>;

// Fixed strings below are schema. Do not edit once users have saved data.
const SALT_SOURCE = "sealedhash-v1";
const KDF_INFO = new TextEncoder().encode("sealedhash-nonce-v1");
const SIGN_MESSAGE_PREFIX = "SealedHash backup key v1\n";

// Lazy, memoized because subtle.digest is async — can't compute at module
// load the way a synchronous buffer literal would.
let saltPromise: Promise<Uint8Array> | null = null;
function getSalt(): Promise<Uint8Array> {
  if (!saltPromise) {
    saltPromise = crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(SALT_SOURCE))
      .then((buf) => new Uint8Array(buf));
  }
  return saltPromise;
}

// Per-tab in-memory cache so the user signs exactly once per session.
// Keyed by lowercased address so casing drift cannot cause a duplicate
// wallet prompt. NOT persisted to localStorage or sessionStorage — that
// would put a high-value secret at rest on disk.
const keyCache = new Map<string, Promise<CryptoKey>>();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("invalid signature hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/// Derive (or return cached) AES-GCM-256 key for this wallet.
/// Prompts `signMessage` exactly once per tab per address.
export async function getBackupKey(
  address: string,
  signMessage: SignMessage,
): Promise<CryptoKey> {
  const who = address.toLowerCase();
  let cached = keyCache.get(who);
  if (cached) return cached;

  cached = (async () => {
    const message = SIGN_MESSAGE_PREFIX + who;
    const signature = await signMessage(message);
    const sigBytes = hexToBytes(signature);

    const baseKey = await crypto.subtle.importKey(
      "raw",
      sigBytes.buffer as ArrayBuffer,
      "HKDF",
      false,
      ["deriveKey"],
    );

    const salt = await getSalt();
    return crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: salt.buffer as ArrayBuffer,
        info: KDF_INFO.buffer as ArrayBuffer,
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  })();

  keyCache.set(who, cached);
  try {
    return await cached;
  } catch (err) {
    // Drop the failed promise so the next call retries the wallet prompt.
    keyCache.delete(who);
    throw err;
  }
}

/// Clear the in-memory key cache. Call on sign-out so a subsequent sign-in
/// with a different wallet cannot reuse the previous wallet's key.
export function clearBackupKey(): void {
  keyCache.clear();
}
