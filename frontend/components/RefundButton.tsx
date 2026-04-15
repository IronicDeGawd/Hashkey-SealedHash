"use client";

import { useState } from "react";
import { refund } from "@/lib/auction";
import { Button } from "@/components/ui/button";

type Props = {
  auctionId: bigint;
  disabled?: boolean;
  reason?: string;
  onRefunded?: () => void;
};

export function RefundButton({
  auctionId,
  disabled,
  reason,
  onRefunded,
}: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
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
      setLog(
        (l) =>
          l + `error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-4">
      {reason && (
        <p className="text-[14px] text-ink/70">{reason}</p>
      )}
      <Button
        variant="primary"
        size="md"
        onClick={onClick}
        disabled={disabled || status === "working"}
      >
        {status === "working" ? "working…" : "Refund escrow"}
      </Button>
      {log && (
        <pre className="w-full max-w-xl max-h-48 overflow-auto whitespace-pre-wrap rounded-[14px] border border-ink/20 bg-ink px-4 py-3 font-mono text-[12px] leading-relaxed text-lime">
          {log}
        </pre>
      )}
    </div>
  );
}
