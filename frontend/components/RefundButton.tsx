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
    <div className="flex flex-col items-start gap-6">
      {reason && (
        <p className="text-base leading-relaxed text-[#191A23]/80">{reason}</p>
      )}
      <Button
        variant="primary"
        size="default"
        onClick={onClick}
        disabled={disabled || status === "working"}
      >
        {status === "working" ? "working…" : "Refund escrow"}
      </Button>
      {log && (
        <pre className="w-full max-w-xl max-h-48 overflow-auto whitespace-pre-wrap rounded-[14px] border border-[#191A23] bg-[#191A23] px-5 py-4 font-mono text-sm leading-relaxed text-[#B9FF66]">
          {log}
        </pre>
      )}
    </div>
  );
}
