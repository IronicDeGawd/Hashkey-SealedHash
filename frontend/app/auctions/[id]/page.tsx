"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  readAuction,
  readCurrentStatus,
  readCommitment,
  statusLabel,
  AuctionStatus,
  type Auction,
  type Commitment,
} from "@/lib/auction";
import { readErc20Metadata, type Erc20Metadata } from "@/lib/erc20";
import { readIsHuman, type KycInfo } from "@/lib/kyc";
import { useWallet } from "@/lib/wallet-context";
import {
  formatTokenAmount,
  formatUnixSeconds,
  countdown,
  shortAddress,
} from "@/lib/format";
import { CommitForm } from "@/components/CommitForm";
import { SettleButton } from "@/components/SettleButton";
import { Card, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Address } from "@/components/ui/address";
import { LinkButton } from "@/components/ui/button";

type DetailData = {
  auction: Auction;
  status: AuctionStatus;
  asset: Erc20Metadata;
  payment: Erc20Metadata;
  commitment: Commitment | null;
  kyc: KycInfo | null;
};

const statusTone = (s: AuctionStatus) => {
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

const ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const { address } = useWallet();
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, forceRerender] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const idStr = params?.id;

  useEffect(() => {
    if (!idStr) return;
    let cancelled = false;
    const id = BigInt(idStr);
    const load = async () => {
      setError(null);
      try {
        const [auction, status] = await Promise.all([
          readAuction(id),
          readCurrentStatus(id),
        ]);
        const [asset, payment] = await Promise.all([
          readErc20Metadata(auction.asset),
          readErc20Metadata(auction.paymentToken),
        ]);
        let commitment: Commitment | null = null;
        let kyc: KycInfo | null = null;
        if (address) {
          [commitment, kyc] = await Promise.all([
            readCommitment(id, address),
            readIsHuman(address),
          ]);
        }
        if (!cancelled)
          setData({ auction, status, asset, payment, commitment, kyc });
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [idStr, address, reloadKey]);

  useEffect(() => {
    const id = setInterval(() => forceRerender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = () => setReloadKey((n) => n + 1);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10 md:py-16">
      <nav className="mb-6 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ink/50">
        <Link href="/auctions" className="hover:text-ink">
          ← All auctions
        </Link>
      </nav>

      {error && (
        <div className="rounded-[14px] border border-danger bg-danger/5 px-5 py-4 font-mono text-[13px] text-danger">
          error: {error}
        </div>
      )}

      {!data && !error && (
        <div className="h-80 animate-pulse rounded-[45px] border border-ink/20 bg-paper/60" />
      )}

      {data && (
        <>
          <header className="mb-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Pill tone={statusTone(data.status)}>
                {statusLabel(data.status)}
              </Pill>
              <span className="font-mono text-[12px] text-ink/40">
                Auction #{idStr}
              </span>
            </div>
            <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-ink md:text-[56px]">
              {formatTokenAmount(
                data.auction.assetAmount,
                data.asset.decimals,
              )}{" "}
              {data.asset.symbol}
            </h1>
            <p className="text-[15px] text-ink/60">
              Seller <Address value={data.auction.seller} copyable={false} />{" "}
              · Paid in {data.payment.symbol}
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <Card variant="paper" hover={false}>
              <div className="flex flex-col gap-5">
                <CardTitle>Summary</CardTitle>
                <dl className="grid gap-4 text-[14px] md:grid-cols-2">
                  <Meta
                    label="Asset"
                    value={`${formatTokenAmount(
                      data.auction.assetAmount,
                      data.asset.decimals,
                    )} ${data.asset.symbol}`}
                    sub={shortAddress(data.asset.address)}
                  />
                  <Meta
                    label="Payment token"
                    value={data.payment.symbol}
                    sub={shortAddress(data.payment.address)}
                  />
                  <Meta
                    label="Reserve"
                    value={`${formatTokenAmount(
                      data.auction.reserve,
                      data.payment.decimals,
                    )} ${data.payment.symbol}`}
                  />
                  <Meta
                    label="Highest revealed bid"
                    value={
                      data.auction.highestBid > 0n
                        ? `${formatTokenAmount(
                            data.auction.highestBid,
                            data.payment.decimals,
                          )} ${data.payment.symbol}`
                        : "—"
                    }
                    sub={
                      data.auction.highestBid > 0n
                        ? `by ${shortAddress(data.auction.highestBidder)}`
                        : undefined
                    }
                  />
                  <Meta
                    label="Commit deadline"
                    value={countdown(data.auction.commitDeadline)}
                    sub={formatUnixSeconds(data.auction.commitDeadline)}
                  />
                  <Meta
                    label="Reveal deadline"
                    value={countdown(data.auction.revealDeadline)}
                    sub={formatUnixSeconds(data.auction.revealDeadline)}
                  />
                </dl>
              </div>
            </Card>

            <Card variant="white" hover={false}>
              <div className="flex flex-col gap-5">
                <CardTitle>Your position</CardTitle>
                {!address && (
                  <p className="text-[14px] text-ink/60">
                    Connect a wallet to see your commitment and KYC.
                  </p>
                )}
                {address && data.kyc && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={data.kyc.isValid ? "lime" : "danger"}>
                      KYC · {data.kyc.isValid ? `level ${data.kyc.level}` : "not approved"}
                    </Pill>
                    {!data.kyc.isValid && (
                      <Link
                        href="/dev"
                        className="font-mono text-[12px] text-ink/60 underline hover:text-ink"
                      >
                        self-KYC in dev tools →
                      </Link>
                    )}
                  </div>
                )}
                {address &&
                  data.commitment &&
                  data.commitment.commitment !== ZERO && (
                    <div className="flex flex-col gap-3">
                      <p className="text-[14px] text-ink/70">
                        You have committed on this auction.
                      </p>
                      <dl className="grid gap-2 rounded-[14px] border border-ink/10 bg-paper/60 p-4 text-[13px]">
                        <div className="flex items-center justify-between">
                          <dt className="font-mono uppercase tracking-[0.12em] text-ink/50">
                            escrow
                          </dt>
                          <dd className="font-mono text-ink">
                            {formatTokenAmount(
                              data.commitment.escrow,
                              data.payment.decimals,
                            )}{" "}
                            {data.payment.symbol}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="font-mono uppercase tracking-[0.12em] text-ink/50">
                            revealed
                          </dt>
                          <dd className="font-mono text-ink">
                            {String(data.commitment.revealed)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="font-mono uppercase tracking-[0.12em] text-ink/50">
                            refunded
                          </dt>
                          <dd className="font-mono text-ink">
                            {String(data.commitment.refunded)}
                          </dd>
                        </div>
                      </dl>
                      <LinkButton
                        href={`/auctions/${idStr}/mybid`}
                        variant="primary"
                        size="sm"
                      >
                        Open my bid page
                      </LinkButton>
                    </div>
                  )}
                {address &&
                  data.commitment &&
                  data.commitment.commitment === ZERO && (
                    <p className="text-[14px] text-ink/60">
                      You have not committed to this auction yet.
                    </p>
                  )}
              </div>
            </Card>
          </div>

          <section className="mt-10">
            <Card variant="ink" hover={false}>
              <div className="flex flex-col gap-6 text-white">
                <div className="flex items-center gap-3">
                  <Pill tone="lime">Actions</Pill>
                  <span className="font-mono text-[12px] text-white/50">
                    phase · {statusLabel(data.status)}
                  </span>
                </div>
                {!address && (
                  <p className="text-[14px] text-white/70">
                    Connect a wallet to bid.
                  </p>
                )}
                {address && data.status === AuctionStatus.COMMIT && (
                  <div className="rounded-[30px] bg-white p-6 text-ink md:p-8">
                    <CommitForm
                      auctionId={data.auction.id}
                      reserve={data.auction.reserve}
                      paymentToken={data.auction.paymentToken}
                      paymentDecimals={data.payment.decimals}
                    />
                  </div>
                )}
                {address && data.status === AuctionStatus.REVEAL && (
                  <div className="flex flex-col items-start gap-4">
                    <p className="text-[14px] text-white/80">
                      Reveal phase is open. Open your bid page to publish your
                      (amount, nonce) pair.
                    </p>
                    <LinkButton
                      href={`/auctions/${idStr}/mybid`}
                      variant="accent"
                      size="md"
                    >
                      Open my bid page
                    </LinkButton>
                  </div>
                )}
                {data.status === AuctionStatus.SETTLEMENT && (
                  <SettleButton
                    auctionId={data.auction.id}
                    onSettled={refresh}
                  />
                )}
                {data.status === AuctionStatus.FINALIZED && (
                  <p className="text-[14px] text-white/80">
                    Auction finalized. Winner{" "}
                    <Address
                      value={data.auction.highestBidder}
                      copyable={false}
                    />
                  </p>
                )}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
        {label}
      </dt>
      <dd className="font-display text-[18px] font-medium text-ink">{value}</dd>
      {sub && (
        <span className="font-mono text-[11px] text-ink/40">{sub}</span>
      )}
    </div>
  );
}
