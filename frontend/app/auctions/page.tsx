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
import { LinkButton } from "@/components/ui/button";
import { Pill, SectionHeading } from "@/components/ui/heading";
import { truncateAddress } from "@/lib/truncate";

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
    <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20">
      <div className="mb-14 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading label="Live auctions" title="Sealed bids, open to anyone" />
        <LinkButton href="/create" variant="primary" size="default">
          Create auction
        </LinkButton>
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

      {rows !== null && rows.length === 0 && (
        <div className="rounded-[45px] border border-dashed border-[#191A23]/30 bg-[#F3F3F3] p-12 text-center md:p-16">
          <h3 className="text-[28px] font-medium text-[#191A23] md:text-[30px]">
            No auctions yet.
          </h3>
          <p className="mt-3 text-base text-[#191A23]/60">
            Be the first — the seller form takes under a minute.
          </p>
          <div className="mt-8 inline-flex">
            <LinkButton href="/create" variant="tertiary">
              Create the first auction
            </LinkButton>
          </div>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ auction, status, asset, payment }) => {
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
                className="group flex flex-col gap-6 rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-8 transition-colors hover:bg-white md:p-10"
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

                <span className="mt-auto inline-flex items-center gap-3 text-base font-medium text-[#191A23] group-hover:gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#191A23]">
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
    <div className={`flex items-center justify-between gap-4 ${className ?? ""}`}>
      <dt className="text-[#191A23]/50">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
