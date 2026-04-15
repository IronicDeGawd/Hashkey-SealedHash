"use client";

import { useWallet } from "@/lib/wallet-context";
import { ensureHashkeyTestnet } from "@/lib/chain";
import { Button } from "@/components/ui/button";
import { Address } from "@/components/ui/address";
import { Pill } from "@/components/ui/pill";

export function WalletButton() {
  const { address, status, error, connect, disconnect, isRightChain, hasWallet } =
    useWallet();

  if (!hasWallet) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" disabled>
          no wallet
        </Button>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
          install okx or metamask
        </span>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <Button variant="outline" size="sm" disabled>
        connecting…
      </Button>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        {!isRightChain && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => ensureHashkeyTestnet()}
          >
            switch to hashkey testnet
          </Button>
        )}
        {isRightChain && (
          <Pill tone="lime" className="hidden md:inline-flex">
            HashKey Testnet
          </Pill>
        )}
        <Address value={address} copyable />
        <Button variant="ghost" size="sm" onClick={disconnect}>
          disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="primary" size="sm" onClick={connect}>
        connect wallet
      </Button>
      {error && (
        <span className="max-w-[220px] font-mono text-[10px] text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
