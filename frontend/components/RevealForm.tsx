"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { revealBid } from "@/lib/auction";
import { loadNonce, clearNonce } from "@/lib/commitment";
import { hashkeyTestnet } from "@/lib/chain";
import { addresses } from "@/lib/addresses";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Pill } from "@/components/ui/heading";

type Props = {
  auctionId: bigint;
  onRevealed?: () => void;
};

export function RevealForm({ auctionId, onRevealed }: Props) {
  const { address } = useWallet();
  const [bid, setBid] = useState("");
  const [nonce, setNonce] = useState("");
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "revealing" | "done" | "error"
  >("idle");
  const [log, setLog] = useState<string>("");

  useEffect(() => {
    if (!address) return;
    const hit = loadNonce({
      chainId: hashkeyTestnet.id,
      auction: addresses.auction,
      auctionId,
      bidder: address,
    });
    if (hit) {
      setBid(hit.bid.toString());
      setNonce(hit.nonce.toString());
      setAutoLoaded(true);
    }
  }, [address, auctionId]);

  async function onReveal() {
    setStatus("revealing");
    setLog("");
    try {
      setLog((l) => l + "sending revealBid tx...\n");
      const hash = await revealBid(auctionId, BigInt(bid), BigInt(nonce));
      setLog((l) => l + `revealBid tx: ${hash}\n`);
      if (address) {
        clearNonce({
          chainId: hashkeyTestnet.id,
          auction: addresses.auction,
          auctionId,
          bidder: address,
        });
      }
      setStatus("done");
      onRevealed?.();
    } catch (err) {
      setLog(
        (l) =>
          l + `error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Pill variant={autoLoaded ? "green" : "white"}>
          {autoLoaded ? "loaded from localStorage" : "no saved nonce"}
        </Pill>
        <Pill variant="white">key · hashkey-sealed-bid-v1</Pill>
      </div>

      <div className="grid max-w-xl gap-5">
        <Field
          label="Bid · raw units"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
          mono
          inputMode="numeric"
        />
        <Field
          label="Nonce · decimal"
          value={nonce}
          onChange={(e) => setNonce(e.target.value)}
          mono
        />
        <Button
          variant="tertiary"
          size="default"
          onClick={onReveal}
          disabled={status === "revealing" || !bid || !nonce}
        >
          {status === "revealing" ? "revealing…" : "Reveal bid"}
        </Button>
      </div>

      {log && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-[14px] border border-[#191A23] bg-[#191A23] px-5 py-4 font-mono text-sm leading-relaxed text-[#B9FF66]">
          {log}
        </pre>
      )}
    </div>
  );
}
