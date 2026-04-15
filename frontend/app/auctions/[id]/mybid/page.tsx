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
import { Card, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Address } from "@/components/ui/address";
import { Mono } from "@/components/ui/mono";

type Data = {
  auction: Auction;
  status: AuctionStatus;
  payment: Erc20Metadata;
  commitment: Commitment;
};

const ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

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
    <div className="mx-auto max-w-[1000px] px-5 py-12 md:px-10 md:py-16">
      <nav className="mb-6 flex items-center gap-4 font-mono text-[12px] uppercase tracking-[0.14em] text-ink/50">
        <Link href={`/auctions/${idStr}`} className="hover:text-ink">
          ← Auction #{idStr}
        </Link>
        <Link href="/auctions" className="hover:text-ink">
          all auctions
        </Link>
      </nav>

      <header className="mb-10 flex flex-col gap-3">
        <Pill tone="lime">My bid</Pill>
        <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-ink md:text-[56px]">
          Your position on auction #{idStr}
        </h1>
      </header>

      {!address && (
        <Card variant="paper" hover={false}>
          <p className="text-[15px] text-ink/70">
            Connect a wallet to view your bid.
          </p>
        </Card>
      )}
      {error && (
        <div className="rounded-[14px] border border-danger bg-danger/5 px-5 py-4 font-mono text-[13px] text-danger">
          error: {error}
        </div>
      )}
      {address && !data && !error && (
        <div className="h-72 animate-pulse rounded-[45px] border border-ink/20 bg-paper/60" />
      )}

      {address && data && (
        <div className="flex flex-col gap-8">
          <Card variant="paper" hover={false}>
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <CardTitle>Commitment</CardTitle>
                <Pill tone={statusTone(data.status)}>
                  {statusLabel(data.status)}
                </Pill>
              </div>
              {data.commitment.commitment === ZERO ? (
                <p className="text-[14px] text-ink/70">
                  You have not committed to this auction.
                </p>
              ) : (
                <dl className="grid gap-4 text-[13px] md:grid-cols-2">
                  <Meta label="Bidder">
                    <Address value={address} />
                  </Meta>
                  <Meta label="Escrow locked">
                    <span className="font-mono text-ink">
                      {formatTokenAmount(
                        data.commitment.escrow,
                        data.payment.decimals,
                      )}{" "}
                      {data.payment.symbol}
                    </span>
                  </Meta>
                  <Meta label="Revealed">
                    <Pill
                      tone={data.commitment.revealed ? "lime" : "paper"}
                    >
                      {String(data.commitment.revealed)}
                    </Pill>
                  </Meta>
                  <Meta label="Refunded">
                    <Pill
                      tone={data.commitment.refunded ? "lime" : "paper"}
                    >
                      {String(data.commitment.refunded)}
                    </Pill>
                  </Meta>
                  <div className="md:col-span-2">
                    <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
                      Commitment hash
                    </span>
                    <Mono className="block break-all rounded-[10px] border border-ink/15 bg-white px-3 py-2">
                      {data.commitment.commitment}
                    </Mono>
                  </div>
                </dl>
              )}
            </div>
          </Card>

          {data.commitment.commitment !== ZERO &&
            !data.commitment.revealed &&
            data.status === AuctionStatus.REVEAL && (
              <Card variant="white" hover={false}>
                <div className="flex flex-col gap-5">
                  <CardTitle>Reveal bid</CardTitle>
                  <RevealForm
                    auctionId={BigInt(idStr!)}
                    onRevealed={refresh}
                  />
                </div>
              </Card>
            )}

          {data.commitment.commitment !== ZERO &&
            data.status === AuctionStatus.COMMIT && (
              <Card variant="paper" hover={false}>
                <p className="text-[14px] text-ink/70">
                  Wait for the commit window to close, then return here to
                  reveal.
                </p>
              </Card>
            )}

          {data.commitment.commitment !== ZERO &&
            data.commitment.revealed &&
            data.status !== AuctionStatus.FINALIZED && (
              <Card variant="paper" hover={false}>
                <p className="text-[14px] text-ink/70">
                  Revealed. Waiting for settlement.
                </p>
              </Card>
            )}

          {data.status === AuctionStatus.FINALIZED && (
            <Card variant="white" hover={false}>
              <div className="flex flex-col gap-5">
                <CardTitle>Finalized</CardTitle>
                {address &&
                address.toLowerCase() ===
                  data.auction.highestBidder.toLowerCase() ? (
                  <p className="text-[14px] text-ink/70">
                    You won this auction. Your escrow surplus was returned
                    atomically in settle() — no refund call needed.
                  </p>
                ) : data.commitment.commitment === ZERO ? (
                  <p className="text-[14px] text-ink/70">
                    Auction finalized. You did not bid.
                  </p>
                ) : data.commitment.refunded ? (
                  <p className="text-[14px] text-ink/70">
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
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
