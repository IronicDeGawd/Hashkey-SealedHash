// AES-GCM-256 encrypt/decrypt for (bid, nonce) pairs.
//
// Threat model: a DB dump must not let an attacker recover any plaintext
// bid or nonce. The server stores ciphertext + iv + ad as opaque bytes and
// never derives or holds the key. Decryption only happens in the browser
// of the wallet owner, after re-deriving the key from a fresh signature.
//
// Security invariants:
//   * NEVER reuse an IV under the same key. GCM nonce reuse does not just
//     leak confidentiality — it leaks the authentication key. Every encrypt
//     gets 12 fresh random bytes from crypto.getRandomValues.
//   * additionalData binds the ciphertext to its scope string. A ciphertext
//     row swapped into a different scope fails the auth tag check before
//     any plaintext is produced.
//   * Plaintext uses bigint.toString() so we serialize 256-bit values
//     without JSON number precision loss.

const IV_BYTES = 12;

export type EncryptedRecord = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  ad: Uint8Array;
};

export type NoncePayload = {
  bid: bigint;
  nonce: bigint;
};

function encodeScopeAd(scope: string): Uint8Array {
  return new TextEncoder().encode(scope);
}

/// Encrypt a (bid, nonce) pair so it can be safely stored on the backend.
/// Each call produces a new random IV; never reuse one.
export async function encryptNonce(
  key: CryptoKey,
  scope: string,
  payload: NoncePayload,
): Promise<EncryptedRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ad = encodeScopeAd(scope);
  const plaintext = new TextEncoder().encode(
    JSON.stringify({ bid: payload.bid.toString(), nonce: payload.nonce.toString() }),
  );

  const ctBuf = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer as ArrayBuffer,
      additionalData: ad.buffer as ArrayBuffer,
    },
    key,
    plaintext.buffer as ArrayBuffer,
  );

  return { ciphertext: new Uint8Array(ctBuf), iv, ad };
}

/// Decrypt an EncryptedRecord. Throws if the ad does not match the expected
/// scope (catching a swapped-row attack before subtle touches the bytes) or
/// if the AES-GCM auth tag is wrong.
export async function decryptNonce(
  key: CryptoKey,
  scope: string,
  record: EncryptedRecord,
): Promise<NoncePayload> {
  const expectedAd = encodeScopeAd(scope);
  if (!bytesEqual(record.ad, expectedAd)) {
    throw new Error("scope/ad mismatch");
  }

  const plaintextBuf = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: record.iv.buffer as ArrayBuffer,
      additionalData: record.ad.buffer as ArrayBuffer,
    },
    key,
    record.ciphertext.buffer as ArrayBuffer,
  );

  const text = new TextDecoder().decode(plaintextBuf);
  const obj = JSON.parse(text) as { bid: string; nonce: string };
  return { bid: BigInt(obj.bid), nonce: BigInt(obj.nonce) };
}

// Constant-ish time compare for small byte buffers. Length mismatch short-
// circuits, but the per-byte loop walks the whole intersection regardless
// of where the first mismatch occurs.
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/// Base64 helpers for the wire format. The server stores raw bytes and
/// the browser uses base64 only for JSON transport.
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
