"use client";

import { useWallet } from "@/lib/wallet-context";
import { ensureHashkeyTestnet } from "@/lib/chain";
import { Button } from "@/components/ui/button";
import { Address } from "@/components/ui/address";
import { Pill } from "@/components/ui/heading";

export function WalletButton() {
  const { address, status, error, connect, disconnect, isRightChain, hasWallet } =
    useWallet();

  if (!hasWallet) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="secondary" size="sm" disabled>
          No wallet
        </Button>
        <span className="text-xs text-[#191A23]/60">
          Install OKX or MetaMask
        </span>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <Button variant="secondary" size="sm" disabled>
        Connecting…
      </Button>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-3">
        {!isRightChain && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => ensureHashkeyTestnet()}
          >
            Switch to HashKey Testnet
          </Button>
        )}
        {isRightChain && (
          <span className="hidden md:inline-block">
            <Pill variant="green">HashKey Testnet</Pill>
          </span>
        )}
        <Address value={address} copyable />
        <Button variant="secondary" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="primary" size="sm" onClick={connect}>
        Connect wallet
      </Button>
      {error && (
        <span className="max-w-[220px] text-xs text-[#8B0000]">{error}</span>
      )}
    </div>
  );
}
