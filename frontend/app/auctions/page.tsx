"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readAllAuctions,
  readCurrentStatus,
  statusLabel,
  type Auction,
  type AuctionStatus,
} from "@/lib/auction";
import { readErc20Metadata, type Erc20Metadata } from "@/lib/erc20";
import { formatTokenAmount, countdown } from "@/lib/format";
import type { Address } from "viem";
import { SectionHeading } from "@/components/ui/heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Address as AddressChip } from "@/components/ui/address";
import { LinkButton } from "@/components/ui/button";

type Row = {
  auction: Auction;
  status: AuctionStatus;
  asset: Erc20Metadata;
  payment: Erc20Metadata;
};

const statusTone = (s: AuctionStatus) => {
  // 0 commit, 1 reveal, 2 settlement, 3 finalized
  switch (s) {
    case 0:
      return "lime" as const;
    case 1:
      return "paper" as const;
    case 2:
      return "white" as const;
    default:
      return "ink" as const;
  }
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
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => forceRerender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          label="Live auctions"
          title="Sealed bids, open to anyone."
          description="Every auction below runs against the HashKey testnet contracts. Connect a wallet to commit a bid."
        />
        <LinkButton href="/create" variant="primary" size="md">
          Create auction
        </LinkButton>
      </div>

      {error && (
        <div className="mt-10 rounded-[14px] border border-danger bg-danger/5 px-5 py-4 font-mono text-[13px] text-danger">
          error: {error}
        </div>
      )}

      {rows === null && !error && (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-60 animate-pulse rounded-[45px] border border-ink/20 bg-paper/60"
            />
          ))}
        </div>
      )}

      {rows !== null && rows.length === 0 && (
        <div className="mt-14 rounded-[45px] border border-dashed border-ink/30 bg-paper p-12 text-center">
          <p className="font-display text-[22px] text-ink">
            No auctions yet.
          </p>
          <p className="mt-2 text-[14px] text-ink/60">
            Be the first — the seller form takes under a minute.
          </p>
          <div className="mt-6 inline-flex">
            <LinkButton href="/create" variant="accent" size="md">
              Create the first auction
            </LinkButton>
          </div>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ auction, status, asset, payment }) => {
            const deadline =
              status === 0
                ? auction.commitDeadline
                : status === 1
                ? auction.revealDeadline
                : 0n;
            return (
              <Card key={auction.id.toString()} variant="white" hover>
                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <Pill tone={statusTone(status)}>{statusLabel(status)}</Pill>
                    <span className="font-mono text-[12px] text-ink/40">
                      #{auction.id.toString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
                      Asset
                    </span>
                    <CardTitle>
                      {formatTokenAmount(auction.assetAmount, asset.decimals)}{" "}
                      {asset.symbol}
                    </CardTitle>
                  </div>
                  <dl className="grid gap-3 border-t border-ink/10 pt-4 text-[13px]">
                    <div className="flex items-center justify-between">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/50">
                        Reserve
                      </dt>
                      <dd className="font-mono text-ink">
                        {formatTokenAmount(
                          auction.reserve,
                          payment.decimals,
                        )}{" "}
                        {payment.symbol}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/50">
                        Seller
                      </dt>
                      <dd>
                        <AddressChip value={auction.seller} copyable={false} />
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/50">
                        Deadline
                      </dt>
                      <dd className="font-mono text-ink">
                        {deadline > 0n ? countdown(deadline) : "—"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-auto pt-3">
                    <Link
                      href={`/auctions/${auction.id.toString()}`}
                      className="inline-flex items-center gap-2 font-display text-[15px] font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                    >
                      Open auction
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
