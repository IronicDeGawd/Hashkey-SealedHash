// Browser-side client for /api/nonces. Ciphertext, IV, and additional data
// stay base64-encoded over the wire — the server stores the raw bytes but
// JSON needs a text shape for bytea columns.

export type EncryptedNonce = {
  scope: string;
  ciphertext: string; // base64
  iv: string; // base64
  ad: string; // base64
  createdAt?: string;
};

export async function putNonceBackup(
  scope: string,
  body: { ciphertext: string; iv: string; ad: string },
): Promise<void> {
  const res = await fetch(`/api/nonces/${encodeURIComponent(scope)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`nonce backup put failed: ${res.status}`);
}

export async function listNonceBackups(): Promise<EncryptedNonce[]> {
  const res = await fetch("/api/nonces", { credentials: "include" });
  if (!res.ok) throw new Error(`nonce backup list failed: ${res.status}`);
  return (await res.json()) as EncryptedNonce[];
}

export async function deleteNonceBackup(scope: string): Promise<void> {
  const res = await fetch(`/api/nonces/${encodeURIComponent(scope)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`nonce backup delete failed: ${res.status}`);
}
