"use client";

import { useState } from "react";
import { settle } from "@/lib/auction";

type Props = {
  auctionId: bigint;
  onSettled?: () => void;
};

/// Anyone can settle a finished auction. The contract pays the seller,
/// transfers the asset to the winner, and refunds the winner's escrow
/// surplus atomically. Non-winners must call refund() separately.
export function SettleButton({ auctionId, onSettled }: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [log, setLog] = useState<string>("");

  async function onClick() {
    setStatus("working");
    setLog("");
    try {
      setLog((l) => l + "sending settle tx...\n");
      const hash = await settle(auctionId);
      setLog((l) => l + `settle tx: ${hash}\n`);
      setStatus("done");
      onSettled?.();
    } catch (err) {
      setLog((l) => l + `error: ${err instanceof Error ? err.message : String(err)}\n`);
      setStatus("error");
    }
  }

  return (
    <section>
      <h3>settle auction</h3>
      <p>anyone can trigger settlement after the reveal window closes.</p>
      <button onClick={onClick} disabled={status === "working"}>
        {status === "working" ? "working..." : "settle"}
      </button>
      <pre style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap", marginTop: 8 }}>{log}</pre>
    </section>
  );
}
