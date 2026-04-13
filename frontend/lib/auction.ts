import type { Abi, Address, Hex } from "viem";
import { publicClient, getWalletClient } from "./chain";
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

// ---- writes --------------------------------------------------------------

/// Submit a sealed commit. The proof is the UltraHonk proof bytes from
/// generateAuctionProof; the commitment is keccak256(abi.encode(bid, nonce)).
/// Caller must have already approved `escrow` of the payment token for the
/// auction contract.
export async function commitBid(
  id: bigint,
  escrow: bigint,
  commitment: Hex,
  proof: Uint8Array,
): Promise<Hex> {
  const wallet = await getWalletClient();
  const proofHex = `0x${Array.from(proof)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as Hex;
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: addresses.auction,
    abi: auctionAbi as Abi,
    functionName: "commitBid",
    args: [id, escrow, commitment, proofHex],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function revealBid(id: bigint, bid: bigint, nonce: bigint): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: addresses.auction,
    abi: auctionAbi as Abi,
    functionName: "revealBid",
    args: [id, bid, nonce],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function settle(id: bigint): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: addresses.auction,
    abi: auctionAbi as Abi,
    functionName: "settle",
    args: [id],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function refund(id: bigint): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: addresses.auction,
    abi: auctionAbi as Abi,
    functionName: "refund",
    args: [id],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/// Seller flow. Assumes the asset token was already approved for the auction.
export type CreateAuctionArgs = {
  asset: Address;
  assetAmount: bigint;
  paymentToken: Address;
  reserve: bigint;
  commitDuration: bigint;
  revealDuration: bigint;
};

export async function createAuction(args: CreateAuctionArgs): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: addresses.auction,
    abi: auctionAbi as Abi,
    functionName: "createAuction",
    args: [
      args.asset,
      args.assetAmount,
      args.paymentToken,
      args.reserve,
      args.commitDuration,
      args.revealDuration,
    ],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
