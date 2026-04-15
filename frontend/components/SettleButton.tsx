"use client";

import { useState } from "react";
import { settle } from "@/lib/auction";
import { Button } from "@/components/ui/button";

type Props = {
  auctionId: bigint;
  onSettled?: () => void;
};

export function SettleButton({ auctionId, onSettled }: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
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
      setLog(
        (l) =>
          l + `error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <p className="text-base leading-relaxed text-current/80">
        Settlement is permissionless. Any address can call settle() once the
        reveal window closes — the winner gets the asset, the seller gets
        paid, losers refund separately.
      </p>
      <Button
        variant="tertiary"
        size="default"
        onClick={onClick}
        disabled={status === "working"}
      >
        {status === "working" ? "working…" : "Settle auction"}
      </Button>
      {log && (
        <pre className="w-full max-w-xl max-h-48 overflow-auto whitespace-pre-wrap rounded-[14px] border border-white/20 bg-black/40 px-5 py-4 font-mono text-sm leading-relaxed text-[#B9FF66]">
          {log}
        </pre>
      )}
    </div>
  );
}
