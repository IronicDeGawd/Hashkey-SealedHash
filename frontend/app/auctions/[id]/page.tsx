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
import { Pill } from "@/components/ui/heading";
import { LinkButton } from "@/components/ui/button";
import { truncateAddress } from "@/lib/truncate";

type DetailData = {
  auction: Auction;
  status: AuctionStatus;
  asset: Erc20Metadata;
  payment: Erc20Metadata;
  commitment: Commitment | null;
  kyc: KycInfo | null;
};

const statusPillVariant = (s: AuctionStatus): "green" | "white" | "black" => {
  if (s === 0) return "green";
  if (s === 1) return "white";
  return "black";
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
    <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-16 md:py-20">
      <nav className="mb-8 flex items-center gap-4 text-sm text-[#191A23]/60">
        <Link href="/auctions" className="hover:text-[#191A23]">
          ← All auctions
        </Link>
      </nav>

      {error && (
        <div className="rounded-[14px] border border-[#8B0000] bg-[#FFE5E5] px-6 py-4 text-base text-[#8B0000]">
          error: {error}
        </div>
      )}

      {!data && !error && (
        <div className="h-80 animate-pulse rounded-[45px] border border-[#191A23]/20 bg-[#F3F3F3]/60" />
      )}

      {data && (
        <>
          {/* Header */}
          <header className="mb-14 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Pill variant={statusPillVariant(data.status)}>
                {statusLabel(data.status)}
              </Pill>
              <span className="font-mono text-sm text-[#191A23]/40">
                Auction #{idStr}
              </span>
            </div>
            <h1 className="text-[40px] font-medium leading-[1.05] text-[#191A23] md:text-[60px] md:leading-[1.1]">
              {formatTokenAmount(
                data.auction.assetAmount,
                data.asset.decimals,
              )}{" "}
              {data.asset.symbol}
            </h1>
            <p className="text-lg text-[#191A23]/70">
              Seller {truncateAddress(data.auction.seller, 6)} · paid in{" "}
              {data.payment.symbol}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr] md:gap-10">
            {/* Summary — paper card */}
            <div className="rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-8 md:p-10">
              <h2 className="mb-8 text-[30px] font-medium leading-[1.2] text-[#191A23]">
                Summary
              </h2>
              <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

            {/* Your position — white card */}
            <div className="rounded-[45px] border border-[#191A23] bg-white p-8 md:p-10">
              <h2 className="mb-8 text-[30px] font-medium leading-[1.2] text-[#191A23]">
                Your position
              </h2>
              {!address && (
                <p className="text-base text-[#191A23]/70">
                  Connect a wallet to see your commitment and KYC.
                </p>
              )}
              {address && data.kyc && (
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <Pill variant={data.kyc.isValid ? "green" : "white"}>
                    KYC · {data.kyc.isValid ? `level ${data.kyc.level}` : "not approved"}
                  </Pill>
                  {!data.kyc.isValid && (
                    <Link
                      href="/dev"
                      className="text-sm text-[#191A23]/70 underline hover:text-[#191A23]"
                    >
                      self-KYC in dev tools →
                    </Link>
                  )}
                </div>
              )}
              {address &&
                data.commitment &&
                data.commitment.commitment !== ZERO && (
                  <div className="flex flex-col gap-5">
                    <p className="text-base text-[#191A23]/70">
                      You have committed on this auction.
                    </p>
                    <dl className="flex flex-col gap-3 rounded-[14px] border border-[#191A23]/15 bg-[#F3F3F3] p-5 text-sm">
                      <PositionRow
                        label="escrow"
                        value={`${formatTokenAmount(
                          data.commitment.escrow,
                          data.payment.decimals,
                        )} ${data.payment.symbol}`}
                      />
                      <PositionRow
                        label="revealed"
                        value={String(data.commitment.revealed)}
                      />
                      <PositionRow
                        label="refunded"
                        value={String(data.commitment.refunded)}
                      />
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
                  <p className="text-base text-[#191A23]/70">
                    You have not committed to this auction yet.
                  </p>
                )}
            </div>
          </div>

          {/* Actions — ink card */}
          <div className="mt-10 rounded-[45px] border border-[#191A23] bg-[#191A23] p-8 md:p-12">
            <div className="mb-8 flex items-center gap-3">
              <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-[7px] py-[5px] text-base font-medium text-[#191A23]">
                Actions
              </span>
              <span className="font-mono text-sm text-white/50">
                phase · {statusLabel(data.status)}
              </span>
            </div>
            {!address && (
              <p className="text-base text-white/70">
                Connect a wallet to bid.
              </p>
            )}
            {address && data.status === AuctionStatus.COMMIT && (
              <div className="rounded-[30px] bg-white p-6 text-[#191A23] md:p-10">
                <CommitForm
                  auctionId={data.auction.id}
                  reserve={data.auction.reserve}
                  paymentToken={data.auction.paymentToken}
                  paymentDecimals={data.payment.decimals}
                />
              </div>
            )}
            {address && data.status === AuctionStatus.REVEAL && (
              <div className="flex flex-col items-start gap-5">
                <p className="text-base text-white/80">
                  Reveal phase is open. Open your bid page to publish your
                  (amount, nonce) pair.
                </p>
                <LinkButton
                  href={`/auctions/${idStr}/mybid`}
                  variant="tertiary"
                >
                  Open my bid page
                </LinkButton>
              </div>
            )}
            {data.status === AuctionStatus.SETTLEMENT && (
              <div className="text-white">
                <SettleButton
                  auctionId={data.auction.id}
                  onSettled={refresh}
                />
              </div>
            )}
            {data.status === AuctionStatus.FINALIZED && (
              <p className="text-base text-white/80">
                Auction finalized. Winner{" "}
                <span className="font-mono text-[#B9FF66]">
                  {truncateAddress(data.auction.highestBidder, 6)}
                </span>
              </p>
            )}
          </div>
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
    <div className="flex flex-col gap-1.5">
      <dt className="text-sm font-medium text-[#191A23]/60">{label}</dt>
      <dd className="text-[20px] font-medium text-[#191A23]">{value}</dd>
      {sub && (
        <span className="font-mono text-xs text-[#191A23]/40">{sub}</span>
      )}
    </div>
  );
}

function PositionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-mono text-sm text-[#191A23]/50">{label}</dt>
      <dd className="font-mono text-sm text-[#191A23]">{value}</dd>
    </div>
  );
}
