"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { revealBid } from "@/lib/auction";
import { loadNonce, clearNonce } from "@/lib/commitment";
import { hashkeyTestnet } from "@/lib/chain";
import { addresses } from "@/lib/addresses";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={autoLoaded ? "lime" : "paper"}>
          {autoLoaded ? "loaded from localStorage" : "no saved nonce"}
        </Pill>
        <Pill tone="white">
          key · hashkey-sealed-bid-v1
        </Pill>
      </div>

      <div className="grid gap-4 md:max-w-xl">
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
          variant="accent"
          size="lg"
          onClick={onReveal}
          disabled={status === "revealing" || !bid || !nonce}
        >
          {status === "revealing" ? "revealing…" : "Reveal bid"}
        </Button>
      </div>

      {log && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-[14px] border border-ink/20 bg-ink px-4 py-3 font-mono text-[12px] leading-relaxed text-lime">
          {log}
        </pre>
      )}
    </div>
  );
}
