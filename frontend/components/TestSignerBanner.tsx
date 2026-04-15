"use client";

import { useWallet } from "@/lib/wallet-context";
import { shortAddress } from "@/lib/format";

export function TestSignerBanner() {
  const { isTestSigner, address } = useWallet();
  if (!isTestSigner) return null;
  return (
    <div
      role="alert"
      className="w-full border-b border-[#191A23] bg-[#B9FF66] px-5 py-3 text-center text-sm font-medium text-[#191A23] md:px-16"
    >
      <span className="mr-3 inline-block rounded-[7px] bg-[#191A23] px-2 py-1 text-xs text-[#B9FF66]">
        TEST SIGNER
      </span>
      active — writes signed by a local key from .env.local (
      <span className="font-mono">{shortAddress(address)}</span>). never
      enable this in production.
    </div>
  );
}
