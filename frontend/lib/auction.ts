import type { Abi, Address } from "viem";
import { publicClient } from "./chain";
import { addresses } from "./addresses";
import { auctionAbi } from "./abis";

export enum AuctionStatus {
  COMMIT = 0,
  REVEAL = 1,
  SETTLEMENT = 2,
  FINALIZED = 3,
}

export type Auction = {
  id: bigint;
  seller: Address;
  asset: Address;
  assetAmount: bigint;
  paymentToken: Address;
  reserve: bigint;
  commitDeadline: bigint;
  revealDeadline: bigint;
  statusStored: AuctionStatus;
  highestBidder: Address;
  highestBid: bigint;
};

export type Commitment = {
  escrow: bigint;
  commitment: `0x${string}`;
  revealed: boolean;
  refunded: boolean;
};

const ABI = auctionAbi as Abi;

export async function readAuctionCount(): Promise<bigint> {
  return (await publicClient.readContract({
    address: addresses.auction,
    abi: ABI,
    functionName: "auctionCount",
  })) as bigint;
}

export async function readAuction(id: bigint): Promise<Auction> {
  const raw = (await publicClient.readContract({
    address: addresses.auction,
    abi: ABI,
    functionName: "auctions",
    args: [id],
  })) as readonly [
    Address,
    Address,
    bigint,
    Address,
    bigint,
    bigint,
    bigint,
    number,
    Address,
    bigint,
  ];
  return {
    id,
    seller: raw[0],
    asset: raw[1],
    assetAmount: raw[2],
    paymentToken: raw[3],
    reserve: raw[4],
    commitDeadline: raw[5],
    revealDeadline: raw[6],
    statusStored: raw[7] as AuctionStatus,
    highestBidder: raw[8],
    highestBid: raw[9],
  };
}

export async function readCurrentStatus(id: bigint): Promise<AuctionStatus> {
  const s = (await publicClient.readContract({
    address: addresses.auction,
    abi: ABI,
    functionName: "currentStatus",
    args: [id],
  })) as number;
  return s as AuctionStatus;
}

export async function readCommitment(id: bigint, bidder: Address): Promise<Commitment> {
  const raw = (await publicClient.readContract({
    address: addresses.auction,
    abi: ABI,
    functionName: "commitments",
    args: [id, bidder],
  })) as readonly [bigint, `0x${string}`, boolean, boolean];
  return {
    escrow: raw[0],
    commitment: raw[1],
    revealed: raw[2],
    refunded: raw[3],
  };
}

/// Convenience: read all auctions 1..count in parallel. For the demo we
/// expect a single-digit count so Promise.all is fine; swap to multicall if
/// the list grows.
export async function readAllAuctions(): Promise<Auction[]> {
  const count = await readAuctionCount();
  if (count === 0n) return [];
  const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1));
  return Promise.all(ids.map(readAuction));
}

export function statusLabel(s: AuctionStatus): string {
  switch (s) {
    case AuctionStatus.COMMIT:
      return "commit";
    case AuctionStatus.REVEAL:
      return "reveal";
    case AuctionStatus.SETTLEMENT:
      return "settlement";
    case AuctionStatus.FINALIZED:
      return "finalized";
    default:
      return "unknown";
  }
}
