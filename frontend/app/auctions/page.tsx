"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { LinkButton } from "@/components/ui/button";
import { Pill, SectionHeading } from "@/components/ui/heading";
import { truncateAddress } from "@/lib/truncate";
import { cn } from "@/lib/cn";

type Row = {
  auction: Auction;
  status: AuctionStatus;
  asset: Erc20Metadata;
  payment: Erc20Metadata;
};

const statusPillVariant = (s: AuctionStatus): "green" | "white" | "black" => {
  if (s === 0) return "green";
  if (s === 1) return "white";
  if (s === 2) return "black";
  return "black";
};

type Filter = "all" | "commit" | "reveal" | "settlement" | "finalized";
const filters: { key: Filter; label: string; status: AuctionStatus | null }[] =
  [
    { key: "all", label: "All", status: null },
    { key: "commit", label: "Commit phase", status: 0 as AuctionStatus },
    { key: "reveal", label: "Reveal phase", status: 1 as AuctionStatus },
    { key: "settlement", label: "Settlement", status: 2 as AuctionStatus },
    { key: "finalized", label: "Finalized", status: 3 as AuctionStatus },
  ];

export default function AuctionsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
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

  const filtered = useMemo(() => {
    if (!rows) return null;
    const active = filters.find((f) => f.key === filter);
    if (!active || active.status === null) return rows;
    return rows.filter((r) => r.status === active.status);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const map: Record<Filter, number> = {
      all: rows?.length ?? 0,
      commit: 0,
      reveal: 0,
      settlement: 0,
      finalized: 0,
    };
    if (!rows) return map;
    for (const r of rows) {
      if (r.status === 0) map.commit++;
      else if (r.status === 1) map.reveal++;
      else if (r.status === 2) map.settlement++;
      else if (r.status === 3) map.finalized++;
    }
    return map;
  }, [rows]);

  return (
    <div className="w-full bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            label="Live auctions"
            title="Sealed bids, open to anyone"
          />
          <LinkButton href="/create" variant="primary" size="default">
            Create auction
          </LinkButton>
        </div>

        {/* Filter pill row */}
        <div className="mb-10 flex flex-wrap items-center gap-3">
          {filters.map((f) => {
            const n = counts[f.key];
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[#191A23] bg-[#191A23] text-white"
                    : "border-[#191A23]/30 bg-white text-[#191A23] hover:border-[#191A23] hover:bg-[#F3F3F3]",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px]",
                    isActive
                      ? "bg-[#B9FF66] text-[#191A23]"
                      : "bg-[#F3F3F3] text-[#191A23]/60",
                  )}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-[14px] border border-[#8B0000] bg-[#FFE5E5] px-6 py-4 text-base text-[#8B0000]">
            error: {error}
          </div>
        )}

        {rows === null && !error && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-[45px] border border-[#191A23]/20 bg-[#F3F3F3]/60"
              />
            ))}
          </div>
        )}

        {filtered !== null && filtered.length === 0 && (
          <div className="rounded-[45px] border border-dashed border-[#191A23]/30 bg-[#F3F3F3] p-12 text-center md:p-16">
            <h3 className="text-[28px] font-medium text-[#191A23] md:text-[30px]">
              {filter === "all"
                ? "No auctions yet."
                : `No auctions in ${filters.find((f) => f.key === filter)?.label.toLowerCase()}.`}
            </h3>
            <p className="mt-3 text-base text-[#191A23]/60">
              {filter === "all"
                ? "Be the first — the seller form takes under a minute."
                : "Try another filter or check back soon."}
            </p>
            <div className="mt-8 inline-flex">
              <LinkButton href="/create" variant="tertiary">
                Create an auction
              </LinkButton>
            </div>
          </div>
        )}

        {filtered !== null && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ auction, status, asset, payment }) => {
              const deadline =
                status === 0
                  ? auction.commitDeadline
                  : status === 1
                    ? auction.revealDeadline
                    : 0n;
              const tone = statusPillVariant(status);
              return (
                <Link
                  key={auction.id.toString()}
                  href={`/auctions/${auction.id.toString()}`}
                  className="group relative flex flex-col gap-6 rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-8 shadow-[0_0_0_0_#191A23] transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-white hover:shadow-[0_6px_0_0_#191A23] md:p-10"
                >
                  <div className="flex items-center justify-between">
                    <Pill variant={tone}>{statusLabel(status)}</Pill>
                    <span className="font-mono text-sm text-[#191A23]/40">
                      #{auction.id.toString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[#191A23]/60">
                      Asset
                    </span>
                    <h3 className="text-[30px] font-medium leading-[1.1] text-[#191A23]">
                      {formatTokenAmount(auction.assetAmount, asset.decimals)}{" "}
                      {asset.symbol}
                    </h3>
                  </div>

                  <dl className="grid grid-cols-1 gap-4 border-t border-[#191A23]/15 pt-5 text-sm md:grid-cols-2">
                    <MetaRow label="Reserve">
                      <span className="font-mono text-[#191A23]">
                        {formatTokenAmount(auction.reserve, payment.decimals)}{" "}
                        {payment.symbol}
                      </span>
                    </MetaRow>
                    <MetaRow label="Deadline">
                      <span className="font-mono text-[#191A23]">
                        {deadline > 0n ? countdown(deadline) : "—"}
                      </span>
                    </MetaRow>
                    <MetaRow label="Seller" className="md:col-span-2">
                      <span className="font-mono text-[#191A23]">
                        {truncateAddress(auction.seller, 6)}
                      </span>
                    </MetaRow>
                  </dl>

                  <span className="mt-auto inline-flex items-center gap-3 text-base font-medium text-[#191A23] transition-[gap] duration-300 ease-out group-hover:gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#191A23] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-[-8deg]">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-white"
                      >
                        <path
                          d="M2 8h12M10 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Open auction
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${className ?? ""}`}
    >
      <dt className="text-[#191A23]/50">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
