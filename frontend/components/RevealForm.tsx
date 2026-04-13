"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { revealBid } from "@/lib/auction";
import { loadNonce, clearNonce } from "@/lib/commitment";
import { hashkeyTestnet } from "@/lib/chain";
import { addresses } from "@/lib/addresses";

type Props = {
  auctionId: bigint;
  onRevealed?: () => void;
};

export function RevealForm({ auctionId, onRevealed }: Props) {
  const { address } = useWallet();
  const [bid, setBid] = useState("");
  const [nonce, setNonce] = useState("");
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "revealing" | "done" | "error">("idle");
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
      setLog((l) => l + `error: ${err instanceof Error ? err.message : String(err)}\n`);
      setStatus("error");
    }
  }

  return (
    <section>
      <h3>reveal bid</h3>
      {autoLoaded && <p>loaded bid + nonce from localStorage.</p>}
      {!autoLoaded && <p>no saved nonce found - enter manually.</p>}
      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label>
          bid (raw units):{" "}
          <input value={bid} onChange={(e) => setBid(e.target.value)} style={{ width: 200 }} />
        </label>
        <label>
          nonce (decimal):{" "}
          <input
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            style={{ width: 440 }}
          />
        </label>
        <button onClick={onReveal} disabled={status === "revealing" || !bid || !nonce}>
          {status === "revealing" ? "revealing..." : "reveal"}
        </button>
      </div>
      <pre style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap", marginTop: 8 }}>{log}</pre>
    </section>
  );
}
