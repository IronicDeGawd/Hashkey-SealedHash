import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auctionHistory } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

// GET /api/history?bidder=<address>
//
// Read-cache lookup for the signed-in wallet's past participation. The
// indexer populates this table from on-chain events (Phase 6) — the chain
// is authoritative, this is purely a UX accelerator. The `bidder` query
// parameter must equal `session.address` so one user can never enumerate
// another user's history.
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const bidder = req.nextUrl.searchParams.get("bidder");
  if (!bidder) return new Response("bidder required", { status: 400 });

  // Case-insensitive lowercasing matches the app-wide convention for 0x
  // addresses. Any mismatch (including wrong capitalization) fails closed.
  if (bidder.toLowerCase() !== session.address!.toLowerCase()) {
    return new Response("forbidden", { status: 403 });
  }

  const rows = await db
    .select()
    .from(auctionHistory)
    .where(eq(auctionHistory.bidder, bidder.toLowerCase()))
    .orderBy(desc(auctionHistory.blockNumber));

  return Response.json(
    rows.map((r) => ({
      chainId: r.chainId,
      auction: r.auction,
      auctionId: r.auctionId.toString(),
      eventType: r.eventType,
      txHash: r.txHash,
      blockNumber: r.blockNumber.toString(),
      payload: r.payload,
      observedAt: r.observedAt,
    })),
  );
}
