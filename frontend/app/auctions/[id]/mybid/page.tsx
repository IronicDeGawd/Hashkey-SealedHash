"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { WalletButton } from "@/components/WalletButton";
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
import { formatTokenAmount, shortAddress } from "@/lib/format";

type Data = {
  auction: Auction;
  status: AuctionStatus;
  payment: Erc20Metadata;
  commitment: Commitment;
};

const ZERO_COMMITMENT = "0x0000000000000000000000000000000000000000000000000000000000000000";

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
        const [auction, status] = await Promise.all([readAuction(id), readCurrentStatus(id)]);
        const [payment, commitment] = await Promise.all([
          readErc20Metadata(auction.paymentToken),
          readCommitment(id, address),
        ]);
        if (!cancelled) setData({ auction, status, payment, commitment });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idStr, address, reloadKey]);

  const refresh = () => setReloadKey((n) => n + 1);

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 720 }}>
      <h1>my bid on auction #{idStr}</h1>
      <p>
        <Link href={`/auctions/${idStr}`}>back to auction</Link> · <Link href="/auctions">all auctions</Link>
      </p>

      <section style={{ marginBottom: 16 }}>
        <WalletButton />
      </section>

      {!address && <p>connect a wallet to view your bid.</p>}
      {error && <pre>error: {error}</pre>}
      {address && !data && !error && <p>loading...</p>}

      {address && data && (
        <>
          <section>
            <h2>commitment</h2>
            {data.commitment.commitment === ZERO_COMMITMENT ? (
              <p>you have not committed to this auction.</p>
            ) : (
              <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: 4 }}>
                <dt>auction status</dt>
                <dd>{statusLabel(data.status)}</dd>
                <dt>bidder</dt>
                <dd>{shortAddress(address)}</dd>
                <dt>escrow locked</dt>
                <dd>
                  {formatTokenAmount(data.commitment.escrow, data.payment.decimals)} {data.payment.symbol}
                </dd>
                <dt>commitment hash</dt>
                <dd>{data.commitment.commitment}</dd>
                <dt>revealed</dt>
                <dd>{String(data.commitment.revealed)}</dd>
                <dt>refunded</dt>
                <dd>{String(data.commitment.refunded)}</dd>
              </dl>
            )}
          </section>

          {data.commitment.commitment !== ZERO_COMMITMENT &&
            !data.commitment.revealed &&
            data.status === AuctionStatus.REVEAL && (
              <section style={{ marginTop: 24 }}>
                <RevealForm auctionId={BigInt(idStr!)} onRevealed={refresh} />
              </section>
            )}

          {data.commitment.commitment !== ZERO_COMMITMENT &&
            data.status === AuctionStatus.COMMIT && (
              <p style={{ marginTop: 16 }}>wait for the commit window to close, then reveal.</p>
            )}

          {data.commitment.commitment !== ZERO_COMMITMENT &&
            data.commitment.revealed &&
            data.status !== AuctionStatus.FINALIZED && (
              <p style={{ marginTop: 16 }}>revealed. waiting for settlement.</p>
            )}

          {data.status === AuctionStatus.FINALIZED && (
            <section style={{ marginTop: 24 }}>
              {address &&
              address.toLowerCase() === data.auction.highestBidder.toLowerCase() ? (
                <p>
                  you won this auction. your escrow surplus was returned atomically in settle();
                  no refund call needed.
                </p>
              ) : data.commitment.commitment === ZERO_COMMITMENT ? (
                <p>auction finalized. you did not bid.</p>
              ) : data.commitment.refunded ? (
                <p>escrow already refunded.</p>
              ) : (
                <RefundButton
                  auctionId={BigInt(idStr!)}
                  reason={
                    data.commitment.revealed
                      ? "you revealed but did not win - pull your escrow back."
                      : "you did not reveal in time - pull your escrow back."
                  }
                  onRefunded={refresh}
                />
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
