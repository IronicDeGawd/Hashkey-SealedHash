"use client";

import { useWallet } from "@/lib/wallet-context";
import { shortAddress } from "@/lib/format";

export function TestSignerBanner() {
  const { isTestSigner, address } = useWallet();
  if (!isTestSigner) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-[60] w-full border-b-2 border-ink bg-lime px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink"
    >
      <span className="mr-2 inline-block rounded-[6px] border border-ink bg-ink px-1.5 py-0.5 text-[10px] text-lime">
        test signer
      </span>
      active — writes are signed by a local key from .env.local (
      {shortAddress(address)}). never enable this in production.
    </div>
  );
}
