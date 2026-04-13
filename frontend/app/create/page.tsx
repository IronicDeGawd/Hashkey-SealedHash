"use client";

import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { WalletButton } from "@/components/WalletButton";
import { addresses } from "@/lib/addresses";
import { approve } from "@/lib/erc20";
import { createAuction } from "@/lib/auction";
import type { Address } from "viem";

export default function CreatePage() {
  const { address } = useWallet();
  const [asset, setAsset] = useState<string>(addresses.mockRwa);
  const [assetAmount, setAssetAmount] = useState("1000000000000000000"); // 1e18 = 1 mRWA
  const [paymentToken, setPaymentToken] = useState<string>(addresses.mockUsdt);
  const [reserve, setReserve] = useState("1000");
  const [commitHours, setCommitHours] = useState("1");
  const [revealHours, setRevealHours] = useState("1");
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<string>("");

  async function onCreate() {
    setStatus("working");
    setLog("");
    try {
      setLog((l) => l + "approving asset token...\n");
      await approve(asset as Address, addresses.auction, BigInt(assetAmount));

      setLog((l) => l + "sending createAuction...\n");
      const hash = await createAuction({
        asset: asset as Address,
        assetAmount: BigInt(assetAmount),
        paymentToken: paymentToken as Address,
        reserve: BigInt(reserve),
        commitDuration: BigInt(commitHours) * 3600n,
        revealDuration: BigInt(revealHours) * 3600n,
      });
      setLog((l) => l + `createAuction tx: ${hash}\n`);
      setStatus("done");
    } catch (err) {
      setLog((l) => l + `error: ${err instanceof Error ? err.message : String(err)}\n`);
      setStatus("error");
    }
  }

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 720 }}>
      <h1>create auction</h1>
      <p>
        <Link href="/auctions">auctions</Link> · <Link href="/">home</Link>
      </p>
      <section style={{ marginBottom: 16 }}>
        <WalletButton />
      </section>

      {!address && <p>connect a wallet to create an auction.</p>}

      {address && (
        <section style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <label>
            asset token:{" "}
            <input value={asset} onChange={(e) => setAsset(e.target.value)} style={{ width: 440 }} />
          </label>
          <label>
            asset amount (raw):{" "}
            <input value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} style={{ width: 260 }} />
          </label>
          <label>
            payment token:{" "}
            <input value={paymentToken} onChange={(e) => setPaymentToken(e.target.value)} style={{ width: 440 }} />
          </label>
          <label>
            reserve (raw):{" "}
            <input value={reserve} onChange={(e) => setReserve(e.target.value)} style={{ width: 180 }} />
          </label>
          <label>
            commit window (hours):{" "}
            <input value={commitHours} onChange={(e) => setCommitHours(e.target.value)} style={{ width: 60 }} />
          </label>
          <label>
            reveal window (hours):{" "}
            <input value={revealHours} onChange={(e) => setRevealHours(e.target.value)} style={{ width: 60 }} />
          </label>
          <button onClick={onCreate} disabled={status === "working"}>
            {status === "working" ? "working..." : "approve asset + create auction"}
          </button>
          <p>status: {status}</p>
          <pre style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap" }}>{log}</pre>
        </section>
      )}
    </main>
  );
}
