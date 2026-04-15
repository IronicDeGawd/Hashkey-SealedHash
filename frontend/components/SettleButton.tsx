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
    <div className="flex flex-col items-start gap-4">
      <p className="text-[14px] text-current/70">
        Settlement is permissionless. Any address can call settle once the
        reveal window closes — the winner gets the asset, the seller gets
        paid.
      </p>
      <Button
        variant="accent"
        size="md"
        onClick={onClick}
        disabled={status === "working"}
      >
        {status === "working" ? "working…" : "Settle auction"}
      </Button>
      {log && (
        <pre className="w-full max-w-xl max-h-48 overflow-auto whitespace-pre-wrap rounded-[14px] border border-white/20 bg-black/30 px-4 py-3 font-mono text-[12px] leading-relaxed text-lime">
          {log}
        </pre>
      )}
    </div>
  );
}
