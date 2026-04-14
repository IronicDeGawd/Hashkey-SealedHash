import { encodeAbiParameters, keccak256, type Hex, type Address } from "viem";
import { getBackupKey } from "./crypto/backup-key";
import {
  base64ToBytes,
  bytesToBase64,
  decryptNonce,
  encryptNonce,
} from "./crypto/nonce-vault";
import {
  putNonceBackup,
  listNonceBackups,
  type EncryptedNonce,
} from "./api/nonce-backup";
import { getMe } from "./auth-client";

/// Return a 256-bit random nonce as bigint. Uses crypto.getRandomValues so
/// it's sound enough for a hackathon demo; a production version would store
/// an encrypted backup.
export function randomNonce(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex);
}

/// Compute the commitment hash the auction contract expects. Must match the
/// Solidity side exactly: keccak256(abi.encode(bid, nonce)) where both are
/// uint256. Using viem's encodeAbiParameters keeps this in lockstep with
/// revealBid's check.
export function computeCommitment(bid: bigint, nonce: bigint): Hex {
  const encoded = encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "uint256" },
    ],
    [bid, nonce],
  );
  return keccak256(encoded);
}

// ---- localStorage persistence -------------------------------------------

const STORAGE_KEY = "hashkey-sealed-bid-v1";

type NonceRecord = {
  bid: string;
  nonce: string;
  committedAt: number;
};

type NonceStore = Record<string, NonceRecord>;

function keyFor(chainId: number, auction: Address, auctionId: bigint, bidder: Address): string {
  return `${chainId}:${auction.toLowerCase()}:${auctionId.toString()}:${bidder.toLowerCase()}`;
}

function readStore(): NonceStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as NonceStore;
  } catch {
    return {};
  }
}

function writeStore(store: NonceStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveNonce(params: {
  chainId: number;
  auction: Address;
  auctionId: bigint;
  bidder: Address;
  bid: bigint;
  nonce: bigint;
}): void {
  const store = readStore();
  store[keyFor(params.chainId, params.auction, params.auctionId, params.bidder)] = {
    bid: params.bid.toString(),
    nonce: params.nonce.toString(),
    committedAt: Date.now(),
  };
  writeStore(store);
}

export function loadNonce(params: {
  chainId: number;
  auction: Address;
  auctionId: bigint;
  bidder: Address;
}): { bid: bigint; nonce: bigint; committedAt: number } | null {
  const store = readStore();
  const hit = store[keyFor(params.chainId, params.auction, params.auctionId, params.bidder)];
  if (!hit) return null;
  return { bid: BigInt(hit.bid), nonce: BigInt(hit.nonce), committedAt: hit.committedAt };
}

export function clearNonce(params: {
  chainId: number;
  auction: Address;
  auctionId: bigint;
  bidder: Address;
}): void {
  const store = readStore();
  delete store[keyFor(params.chainId, params.auction, params.auctionId, params.bidder)];
  writeStore(store);
}

// ---- optional remote backup (v2 off-chain) -------------------------------
//
// The functions below wrap the localStorage path so callers can opt into
// encrypted remote backup without changing any existing call site. The
// storage key `hashkey-sealed-bid-v1` stays fixed forever — renaming it
// would orphan in-flight nonces on users that still have only a local copy.

type SignMessage = (message: string) => Promise<`0x${string}`>;

type ScopeInput = {
  chainId: number;
  auction: Address;
  auctionId: bigint;
  bidder: Address;
};

export function scopeFor(params: ScopeInput): string {
  return keyFor(params.chainId, params.auction, params.auctionId, params.bidder);
}

/// Save a nonce locally (fallback) AND, if the user is signed in, push an
/// encrypted copy to the backup API. Network or crypto failures log and
/// swallow — the local copy is still the source of truth for this device.
export async function saveNonceWithBackup(params: {
  chainId: number;
  auction: Address;
  auctionId: bigint;
  bidder: Address;
  bid: bigint;
  nonce: bigint;
  signMessage: SignMessage;
}): Promise<{ backedUp: boolean }> {
  saveNonce({
    chainId: params.chainId,
    auction: params.auction,
    auctionId: params.auctionId,
    bidder: params.bidder,
    bid: params.bid,
    nonce: params.nonce,
  });

  try {
    const me = await getMe();
    if (!me || me.toLowerCase() !== params.bidder.toLowerCase()) {
      return { backedUp: false };
    }
    const key = await getBackupKey(params.bidder, params.signMessage);
    const scope = scopeFor(params);
    const rec = await encryptNonce(key, scope, { bid: params.bid, nonce: params.nonce });
    await putNonceBackup(scope, {
      ciphertext: bytesToBase64(rec.ciphertext),
      iv: bytesToBase64(rec.iv),
      ad: bytesToBase64(rec.ad),
    });
    return { backedUp: true };
  } catch (err) {
    console.warn("[commitment] backup failed:", err);
    return { backedUp: false };
  }
}

/// Load a nonce from local storage first; if missing and the user is signed
/// in, fall back to fetching the encrypted backup and decrypting. On a
/// successful remote decrypt we write the plaintext back to localStorage so
/// subsequent reveals on this device skip the wallet prompt.
export async function loadNonceWithBackup(params: {
  chainId: number;
  auction: Address;
  auctionId: bigint;
  bidder: Address;
  signMessage: SignMessage;
}): Promise<{ bid: bigint; nonce: bigint; committedAt: number } | null> {
  const local = loadNonce(params);
  if (local) return local;

  try {
    const me = await getMe();
    if (!me || me.toLowerCase() !== params.bidder.toLowerCase()) return null;

    const scope = scopeFor(params);
    const rows = await listNonceBackups();
    const hit: EncryptedNonce | undefined = rows.find((r) => r.scope === scope);
    if (!hit) return null;

    const key = await getBackupKey(params.bidder, params.signMessage);
    const { bid, nonce } = await decryptNonce(key, scope, {
      ciphertext: base64ToBytes(hit.ciphertext),
      iv: base64ToBytes(hit.iv),
      ad: base64ToBytes(hit.ad),
    });

    // Cache plaintext in localStorage so the next read is instant and does
    // not require another wallet prompt.
    saveNonce({
      chainId: params.chainId,
      auction: params.auction,
      auctionId: params.auctionId,
      bidder: params.bidder,
      bid,
      nonce,
    });
    return { bid, nonce, committedAt: Date.now() };
  } catch (err) {
    console.warn("[commitment] remote restore failed:", err);
    return null;
  }
}
