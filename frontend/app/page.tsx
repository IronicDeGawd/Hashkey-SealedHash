"use client";

import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { WalletButton } from "@/components/WalletButton";
import { addresses } from "@/lib/addresses";
import { shortAddress } from "@/lib/format";

export default function Home() {
  const { address, chainId, isRightChain } = useWallet();

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 720 }}>
      <h1>Sealed-Bid Auction</h1>
      <p>Private RWA auctions on HashKey Chain, secured by a Noir range-proof circuit.</p>

      <section style={{ marginBottom: 16 }}>
        <WalletButton />
        <div>
          {address ? `connected: ${shortAddress(address)}` : "not connected"} · chainId {chainId ?? "?"} · right chain {String(isRightChain)}
        </div>
      </section>

      <nav>
        <ul>
          <li>
            <Link href="/auctions">browse auctions</Link>
          </li>
          <li>
            <Link href="/create">create an auction</Link>
          </li>
          <li>
            <Link href="/dev">dev tools (mint, self-kyc, zk smoke-test)</Link>
          </li>
        </ul>
      </nav>

      <section style={{ marginTop: 24 }}>
        <h2>deployed contracts (hashkey testnet)</h2>
        <pre>
          {`Verifier         ${addresses.verifier}
KycSBT           ${addresses.kycSbt}
Auction          ${addresses.auction}
mRWA             ${addresses.mockRwa}
mUSDT            ${addresses.mockUsdt}`}
        </pre>
      </section>
    </main>
  );
}
