export type HistoryRow = {
  chainId: number;
  auction: string;
  auctionId: string; // bigint serialized
  eventType: "committed" | "revealed" | "won" | "refunded" | "seller";
  txHash: string;
  blockNumber: string; // bigint serialized
  payload: Record<string, unknown>;
  observedAt: string;
};

export async function getMyHistory(address: string): Promise<HistoryRow[]> {
  const url = `/api/history?bidder=${encodeURIComponent(address.toLowerCase())}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`history fetch failed: ${res.status}`);
  return (await res.json()) as HistoryRow[];
}
