// SealedHash on-chain history indexer.
//
// Single-tick runner: scans a bounded block window, decodes Auction events,
// upserts rows into auction_history, advances indexer_state.last_indexed_block,
// then exits. A systemd .timer triggers it again every 30 seconds. The
// script owns its whole run-to-completion cycle — no setInterval, no long-
// running loop, no HTTP layer.
//
// This file only ever reads public chain data. It must never import from
// frontend/lib/crypto or any other module that touches a wallet secret.
//
// Invocation: `npx tsx frontend/scripts/indexer.ts`

// MUST be the first import. Populates process.env before any downstream
// module reads it at init time — frontend/lib/db/client.ts builds its pg
// Pool from DATABASE_URL at top-level, so the env has to be loaded before
// that import resolves. ES module imports run in declaration order, so
// placing this first is load-bearing.
import "./_loadenv";

import { createPublicClient, decodeEventLog, http, parseAbiItem } from "viem";
import { eq, sql } from "drizzle-orm";
import { hashkeyTestnet } from "../lib/chain";
import { db } from "../lib/db/client";
import { auctionHistory, indexerState } from "../lib/db/schema";
import { addresses } from "../lib/addresses";

const INDEXER_KEY = "sealed_bid_auction";
const SCAN_WINDOW = 5000n; // hard cap so a long downtime stays chunked
const CHAIN_ID = hashkeyTestnet.id;

const rpcUrl =
  process.env.INDEXER_RPC_URL ??
  process.env.NEXT_PUBLIC_HASHKEY_RPC_URL ??
  "https://testnet.hsk.xyz";

const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(rpcUrl),
});

// Event ABI fragments — kept inline so the script is self-contained and
// survives any future reshuffle of the shared abis/ folder.
const BidCommittedEvent = parseAbiItem(
  "event BidCommitted(uint256 indexed id, address indexed bidder, uint256 escrow, bytes32 commitment)",
);
const BidRevealedEvent = parseAbiItem(
  "event BidRevealed(uint256 indexed id, address indexed bidder, uint256 bid)",
);
const AuctionSettledEvent = parseAbiItem(
  "event AuctionSettled(uint256 indexed id, address indexed winner, uint256 winningBid)",
);
const RefundedEvent = parseAbiItem(
  "event Refunded(uint256 indexed id, address indexed bidder, uint256 amount)",
);

type HistoryRow = typeof auctionHistory.$inferInsert;

async function main(): Promise<void> {
  // 1. Read cursor.
  const [state] = await db
    .select()
    .from(indexerState)
    .where(eq(indexerState.key, INDEXER_KEY));
  if (!state) {
    throw new Error(
      `indexer_state missing row for key=${INDEXER_KEY} — did the seed migration run?`,
    );
  }

  const cursor = BigInt(state.lastIndexedBlock);
  const fromBlock = cursor + 1n;
  const latest = await publicClient.getBlockNumber();
  if (fromBlock > latest) {
    console.log(`nothing to do: cursor=${cursor} latest=${latest}`);
    return;
  }
  const toBlock = fromBlock + SCAN_WINDOW - 1n > latest ? latest : fromBlock + SCAN_WINDOW - 1n;

  // 2. Pull logs for every event type in one shot.
  const logs = await publicClient.getLogs({
    address: addresses.auction,
    events: [BidCommittedEvent, BidRevealedEvent, AuctionSettledEvent, RefundedEvent],
    fromBlock,
    toBlock,
  });

  // 3. Decode and build rows.
  const rows: HistoryRow[] = [];
  for (const log of logs) {
    let decoded;
    try {
      decoded = decodeEventLog({
        abi: [BidCommittedEvent, BidRevealedEvent, AuctionSettledEvent, RefundedEvent],
        data: log.data,
        topics: log.topics,
      });
    } catch {
      continue; // not one of ours — skip silently
    }

    const base = {
      chainId: CHAIN_ID,
      auction: addresses.auction.toLowerCase(),
      txHash: log.transactionHash.toLowerCase(),
      blockNumber: log.blockNumber,
      observedAt: new Date(),
    };

    switch (decoded.eventName) {
      case "BidCommitted": {
        const args = decoded.args as {
          id: bigint;
          bidder: `0x${string}`;
          escrow: bigint;
          commitment: `0x${string}`;
        };
        rows.push({
          ...base,
          auctionId: args.id,
          bidder: args.bidder.toLowerCase(),
          eventType: "committed",
          payload: { escrow: args.escrow.toString(), commitment: args.commitment },
        });
        break;
      }
      case "BidRevealed": {
        const args = decoded.args as { id: bigint; bidder: `0x${string}`; bid: bigint };
        rows.push({
          ...base,
          auctionId: args.id,
          bidder: args.bidder.toLowerCase(),
          eventType: "revealed",
          // Revealed bids are already public on-chain post-reveal, so it
          // is fine to store the plaintext amount here.
          payload: { bid: args.bid.toString() },
        });
        break;
      }
      case "AuctionSettled": {
        const args = decoded.args as {
          id: bigint;
          winner: `0x${string}`;
          winningBid: bigint;
        };
        rows.push({
          ...base,
          auctionId: args.id,
          bidder: args.winner.toLowerCase(),
          eventType: "won",
          payload: { winningBid: args.winningBid.toString() },
        });
        break;
      }
      case "Refunded": {
        const args = decoded.args as { id: bigint; bidder: `0x${string}`; amount: bigint };
        rows.push({
          ...base,
          auctionId: args.id,
          bidder: args.bidder.toLowerCase(),
          eventType: "refunded",
          payload: { amount: args.amount.toString() },
        });
        break;
      }
    }
  }

  // 4. Batch upsert. Composite PK + ON CONFLICT DO NOTHING means a
  // re-scan over the same window is a silent no-op.
  if (rows.length > 0) {
    await db.insert(auctionHistory).values(rows).onConflictDoNothing();
  }

  // 5. Advance the cursor. The guard on `last_indexed_block < $toBlock`
  // means two concurrent indexer instances (belt-and-braces; systemd
  // only runs one) can't rewind each other.
  await db
    .update(indexerState)
    .set({ lastIndexedBlock: toBlock, updatedAt: new Date() })
    .where(sql`${indexerState.key} = ${INDEXER_KEY} AND ${indexerState.lastIndexedBlock} < ${toBlock}`);

  console.log(`indexed ${rows.length} events, blocks ${fromBlock}-${toBlock}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("indexer failed:", err);
    process.exit(1);
  });
