"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { RevealForm } from "@/components/RevealForm";
import { RefundButton } from "@/components/RefundButton";
import {
  AuctionStatus,
  readAuction,
  readCommitment,
  readCurrentStatus,
  statusLabel,
  type Auction,
  type Commitment,
} from "@/lib/auction";
import { readErc20Metadata, type Erc20Metadata } from "@/lib/erc20";
import { formatTokenAmount } from "@/lib/format";
import { Pill } from "@/components/ui/heading";
import { truncateAddress } from "@/lib/truncate";

type Data = {
  auction: Auction;
  status: AuctionStatus;
  payment: Erc20Metadata;
  commitment: Commitment;
};

const ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const statusPillVariant = (s: AuctionStatus): "green" | "white" | "black" => {
  if (s === 0) return "green";
  if (s === 1) return "white";
  return "black";
};

export default function MyBidPage() {
  const params = useParams<{ id: string }>();
  const idStr = params?.id;
  const { address } = useWallet();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!idStr || !address) return;
    let cancelled = false;
    const id = BigInt(idStr);
    (async () => {
      try {
        const [auction, status] = await Promise.all([
          readAuction(id),
          readCurrentStatus(id),
        ]);
        const [payment, commitment] = await Promise.all([
          readErc20Metadata(auction.paymentToken),
          readCommitment(id, address),
        ]);
        if (!cancelled) setData({ auction, status, payment, commitment });
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idStr, address, reloadKey]);

  const refresh = () => setReloadKey((n) => n + 1);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-16 md:py-20">
      <nav className="mb-8 flex items-center gap-6 text-sm text-[#191A23]/60">
        <Link
          href={`/auctions/${idStr}`}
          className="hover:text-[#191A23]"
        >
          ← Auction #{idStr}
        </Link>
        <Link href="/auctions" className="hover:text-[#191A23]">
          all auctions
        </Link>
      </nav>

      <header className="mb-14 flex flex-col gap-5">
        <Pill variant="green">My bid</Pill>
        <h1 className="text-[40px] font-medium leading-[1.05] text-[#191A23] md:text-[60px] md:leading-[1.1]">
          Your position on auction #{idStr}
        </h1>
      </header>

      {!address && (
        <div className="rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-10">
          <p className="text-base text-[#191A23]/70">
            Connect a wallet to view your bid.
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-[14px] border border-[#8B0000] bg-[#FFE5E5] px-6 py-4 text-base text-[#8B0000]">
          error: {error}
        </div>
      )}
      {address && !data && !error && (
        <div className="h-80 animate-pulse rounded-[45px] border border-[#191A23]/20 bg-[#F3F3F3]/60" />
      )}

      {address && data && (
        <div className="flex flex-col gap-10">
          {/* Commitment card */}
          <div className="rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-8 md:p-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[30px] font-medium leading-[1.2] text-[#191A23]">
                Commitment
              </h2>
              <Pill variant={statusPillVariant(data.status)}>
                {statusLabel(data.status)}
              </Pill>
            </div>
            {data.commitment.commitment === ZERO ? (
              <p className="text-base text-[#191A23]/70">
                You have not committed to this auction.
              </p>
            ) : (
              <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <MetaBlock label="Bidder">
                  <span className="font-mono text-[#191A23]">
                    {truncateAddress(address, 6)}
                  </span>
                </MetaBlock>
                <MetaBlock label="Escrow locked">
                  <span className="font-mono text-[#191A23]">
                    {formatTokenAmount(
                      data.commitment.escrow,
                      data.payment.decimals,
                    )}{" "}
                    {data.payment.symbol}
                  </span>
                </MetaBlock>
                <MetaBlock label="Revealed">
                  <Pill
                    variant={data.commitment.revealed ? "green" : "white"}
                  >
                    {String(data.commitment.revealed)}
                  </Pill>
                </MetaBlock>
                <MetaBlock label="Refunded">
                  <Pill
                    variant={data.commitment.refunded ? "green" : "white"}
                  >
                    {String(data.commitment.refunded)}
                  </Pill>
                </MetaBlock>
                <div className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-[#191A23]/60">
                    Commitment hash
                  </span>
                  <pre className="whitespace-pre-wrap break-all rounded-[14px] border border-[#191A23]/15 bg-white px-4 py-3 font-mono text-sm text-[#191A23]">
                    {data.commitment.commitment}
                  </pre>
                </div>
              </dl>
            )}
          </div>

          {/* Reveal card — only in reveal phase */}
          {data.commitment.commitment !== ZERO &&
            !data.commitment.revealed &&
            data.status === AuctionStatus.REVEAL && (
              <div className="rounded-[45px] border border-[#191A23] bg-white p-8 md:p-10">
                <h2 className="mb-8 text-[30px] font-medium leading-[1.2] text-[#191A23]">
                  Reveal bid
                </h2>
                <RevealForm
                  auctionId={BigInt(idStr!)}
                  onRevealed={refresh}
                />
              </div>
            )}

          {/* Waiting cards */}
          {data.commitment.commitment !== ZERO &&
            data.status === AuctionStatus.COMMIT && (
              <div className="rounded-[45px] border border-[#191A23] bg-[#B9FF66] p-8 md:p-10">
                <p className="text-base leading-relaxed text-[#191A23]">
                  Wait for the commit window to close, then return here to
                  reveal.
                </p>
              </div>
            )}

          {data.commitment.commitment !== ZERO &&
            data.commitment.revealed &&
            data.status !== AuctionStatus.FINALIZED && (
              <div className="rounded-[45px] border border-[#191A23] bg-[#B9FF66] p-8 md:p-10">
                <p className="text-base leading-relaxed text-[#191A23]">
                  Revealed. Waiting for settlement.
                </p>
              </div>
            )}

          {/* Finalized card */}
          {data.status === AuctionStatus.FINALIZED && (
            <div className="rounded-[45px] border border-[#191A23] bg-white p-8 md:p-10">
              <h2 className="mb-6 text-[30px] font-medium leading-[1.2] text-[#191A23]">
                Finalized
              </h2>
              {address &&
              address.toLowerCase() ===
                data.auction.highestBidder.toLowerCase() ? (
                <p className="text-base leading-relaxed text-[#191A23]/70">
                  You won this auction. Your escrow surplus was returned
                  atomically in settle() — no refund call needed.
                </p>
              ) : data.commitment.commitment === ZERO ? (
                <p className="text-base leading-relaxed text-[#191A23]/70">
                  Auction finalized. You did not bid.
                </p>
              ) : data.commitment.refunded ? (
                <p className="text-base leading-relaxed text-[#191A23]/70">
                  Escrow already refunded.
                </p>
              ) : (
                <RefundButton
                  auctionId={BigInt(idStr!)}
                  reason={
                    data.commitment.revealed
                      ? "You revealed but did not win — pull your escrow back."
                      : "You did not reveal in time — pull your escrow back."
                  }
                  onRefunded={refresh}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-sm font-medium text-[#191A23]/60">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
