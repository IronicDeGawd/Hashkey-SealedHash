"use client";

import { useState } from "react";
import { refund } from "@/lib/auction";

type Props = {
  auctionId: bigint;
  disabled?: boolean;
  reason?: string;
  onRefunded?: () => void;
};

/// Pull-pattern refund. Available to any non-winning bidder after the
/// auction is finalized, including committers who never revealed. The
/// winner has no refund path - their surplus escrow is returned atomically
/// in settle().
export function RefundButton({ auctionId, disabled, reason, onRefunded }: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [log, setLog] = useState<string>("");

  async function onClick() {
    setStatus("working");
    setLog("");
    try {
      setLog((l) => l + "sending refund tx...\n");
      const hash = await refund(auctionId);
      setLog((l) => l + `refund tx: ${hash}\n`);
      setStatus("done");
      onRefunded?.();
    } catch (err) {
      setLog((l) => l + `error: ${err instanceof Error ? err.message : String(err)}\n`);
      setStatus("error");
    }
  }

  return (
    <section>
      <h3>refund escrow</h3>
      {reason && <p>{reason}</p>}
      <button onClick={onClick} disabled={disabled || status === "working"}>
        {status === "working" ? "working..." : "refund"}
      </button>
      <pre style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap", marginTop: 8 }}>{log}</pre>
    </section>
  );
}
