"use client";

import { useWallet } from "@/lib/wallet-context";
import { shortAddress } from "@/lib/format";
import { ensureHashkeyTestnet } from "@/lib/chain";

/// Minimal wallet button. Four states: no wallet, idle, connecting, connected.
/// Intentionally unstyled - design team replaces this component wholesale later.
export function WalletButton() {
  const { address, status, error, connect, disconnect, isRightChain, hasWallet } = useWallet();

  if (!hasWallet) {
    return (
      <div>
        <button disabled>no wallet</button>
        <div>install okx or metamask</div>
      </div>
    );
  }

  if (status === "connecting") {
    return <button disabled>connecting...</button>;
  }

  if (address) {
    return (
      <div>
        <span>{shortAddress(address)}</span>
        {!isRightChain && (
          <button onClick={() => ensureHashkeyTestnet()}>switch to hashkey testnet</button>
        )}
        <button onClick={disconnect}>disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={connect}>connect wallet</button>
      {error && <div>error: {error}</div>}
    </div>
  );
}
