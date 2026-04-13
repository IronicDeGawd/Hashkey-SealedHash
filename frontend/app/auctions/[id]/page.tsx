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
import { formatTokenAmount, formatUnixSeconds, countdown, shortAddress } from "@/lib/format";
import { WalletButton } from "@/components/WalletButton";
import { CommitForm } from "@/components/CommitForm";

type DetailData = {
  auction: Auction;
  status: AuctionStatus;
  asset: Erc20Metadata;
  payment: Erc20Metadata;
  commitment: Commitment | null;
  kyc: KycInfo | null;
};

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const { address } = useWallet();
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, forceRerender] = useState(0);

  const idStr = params?.id;

  useEffect(() => {
    if (!idStr) return;
    let cancelled = false;
    const id = BigInt(idStr);
    const load = async () => {
      setError(null);
      try {
        const [auction, status] = await Promise.all([readAuction(id), readCurrentStatus(id)]);
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
        if (!cancelled) setData({ auction, status, asset, payment, commitment, kyc });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [idStr, address]);

  useEffect(() => {
    const id = setInterval(() => forceRerender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 960 }}>
      <h1>auction #{idStr}</h1>
      <p>
        <Link href="/auctions">back to list</Link> · <Link href="/">home</Link>
      </p>
      <section style={{ marginBottom: 16 }}>
        <WalletButton />
      </section>

      {error && <pre>error: {error}</pre>}
      {!data && !error && <p>loading...</p>}

      {data && (
        <>
          <section>
            <h2>summary</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: 4 }}>
              <dt>status</dt>
              <dd>{statusLabel(data.status)}</dd>
              <dt>seller</dt>
              <dd>{data.auction.seller}</dd>
              <dt>asset</dt>
              <dd>
                {formatTokenAmount(data.auction.assetAmount, data.asset.decimals)} {data.asset.symbol}{" "}
                <small>({shortAddress(data.asset.address)})</small>
              </dd>
              <dt>payment token</dt>
              <dd>
                {data.payment.symbol} <small>({shortAddress(data.payment.address)})</small>
              </dd>
              <dt>reserve</dt>
              <dd>
                {formatTokenAmount(data.auction.reserve, data.payment.decimals)} {data.payment.symbol}
              </dd>
              <dt>commit deadline</dt>
              <dd>
                {formatUnixSeconds(data.auction.commitDeadline)}{" "}
                ({countdown(data.auction.commitDeadline)})
              </dd>
              <dt>reveal deadline</dt>
              <dd>
                {formatUnixSeconds(data.auction.revealDeadline)}{" "}
                ({countdown(data.auction.revealDeadline)})
              </dd>
              <dt>highest revealed bid</dt>
              <dd>
                {data.auction.highestBid > 0n
                  ? `${formatTokenAmount(data.auction.highestBid, data.payment.decimals)} ${data.payment.symbol} by ${shortAddress(data.auction.highestBidder)}`
                  : "-"}
              </dd>
            </dl>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>your position</h2>
            {!address && <p>connect a wallet to see your commitment and kyc.</p>}
            {address && data.kyc && (
              <p>
                kyc: {data.kyc.isValid ? `approved (level ${data.kyc.level})` : "not approved"}{" "}
                {!data.kyc.isValid && <Link href="/dev">go to dev tools to self-kyc</Link>}
              </p>
            )}
            {address && data.commitment && data.commitment.commitment !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
              <>
                <p>
                  you have a commitment on this auction. escrow{" "}
                  {formatTokenAmount(data.commitment.escrow, data.payment.decimals)}{" "}
                  {data.payment.symbol}. revealed: {String(data.commitment.revealed)}. refunded:{" "}
                  {String(data.commitment.refunded)}.
                </p>
                <p>
                  <Link href={`/auctions/${idStr}/mybid`}>open my bid page</Link>
                </p>
              </>
            )}
            {address &&
              data.commitment &&
              data.commitment.commitment === "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                <p>you have not committed to this auction yet.</p>
              )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>actions</h2>
            {!address && <p>connect a wallet to bid.</p>}
            {address && data.status === AuctionStatus.COMMIT && (
              <CommitForm
                auctionId={data.auction.id}
                reserve={data.auction.reserve}
                paymentToken={data.auction.paymentToken}
                paymentDecimals={data.payment.decimals}
              />
            )}
            {address && data.status === AuctionStatus.REVEAL && (
              <p>reveal phase - reveal ui lands in phase e.</p>
            )}
            {address && data.status === AuctionStatus.SETTLEMENT && (
              <p>settlement phase - settle button lands in phase f.</p>
            )}
            {data.status === AuctionStatus.FINALIZED && (
              <p>auction finalized. winner: {shortAddress(data.auction.highestBidder)}</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
