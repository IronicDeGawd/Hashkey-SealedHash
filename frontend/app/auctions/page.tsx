"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAllAuctions, readCurrentStatus, statusLabel, type Auction, type AuctionStatus } from "@/lib/auction";
import { readErc20Metadata, type Erc20Metadata } from "@/lib/erc20";
import { formatTokenAmount, shortAddress, countdown } from "@/lib/format";
import type { Address } from "viem";

type Row = {
  auction: Auction;
  status: AuctionStatus;
  asset: Erc20Metadata;
  payment: Erc20Metadata;
};

export default function AuctionsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, forceRerender] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const auctions = await readAllAuctions();
        const tokenCache = new Map<Address, Erc20Metadata>();
        const fetchToken = async (addr: Address): Promise<Erc20Metadata> => {
          const hit = tokenCache.get(addr);
          if (hit) return hit;
          const meta = await readErc20Metadata(addr);
          tokenCache.set(addr, meta);
          return meta;
        };
        const enriched = await Promise.all(
          auctions.map(async (a) => {
            const [status, asset, payment] = await Promise.all([
              readCurrentStatus(a.id),
              fetchToken(a.asset),
              fetchToken(a.paymentToken),
            ]);
            return { auction: a, status, asset, payment } satisfies Row;
          }),
        );
        if (!cancelled) setRows(enriched);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tick every second so the countdown columns refresh.
  useEffect(() => {
    const id = setInterval(() => forceRerender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 960 }}>
      <h1>auctions</h1>
      <p>
        <Link href="/">home</Link> · <Link href="/create">create auction</Link> ·{" "}
        <Link href="/dev">dev tools</Link>
      </p>
      {error && <pre>error: {error}</pre>}
      {rows === null && !error && <p>loading...</p>}
      {rows !== null && rows.length === 0 && <p>no auctions yet.</p>}
      {rows !== null && rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              <th align="left">#</th>
              <th align="left">seller</th>
              <th align="left">asset</th>
              <th align="right">reserve</th>
              <th align="left">status</th>
              <th align="left">deadline</th>
              <th align="left"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ auction, status, asset, payment }) => {
              const deadline =
                status === 0 ? auction.commitDeadline : status === 1 ? auction.revealDeadline : 0n;
              return (
                <tr key={auction.id.toString()}>
                  <td>{auction.id.toString()}</td>
                  <td>{shortAddress(auction.seller)}</td>
                  <td>
                    {formatTokenAmount(auction.assetAmount, asset.decimals)} {asset.symbol}
                  </td>
                  <td align="right">
                    {formatTokenAmount(auction.reserve, payment.decimals)} {payment.symbol}
                  </td>
                  <td>{statusLabel(status)}</td>
                  <td>{deadline > 0n ? countdown(deadline) : "-"}</td>
                  <td>
                    <Link href={`/auctions/${auction.id.toString()}`}>open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
