import { encodeAbiParameters, keccak256, type Hex, type Address } from "viem";

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
