"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { WalletButton } from "@/components/WalletButton";
import { addresses } from "@/lib/addresses";
import { generateAuctionProof } from "@/lib/prove";
import { mint, readBalance, readErc20Metadata } from "@/lib/erc20";
import { readIsHuman, selfKycMock, type KycInfo } from "@/lib/kyc";
import { formatTokenAmount, shortAddress } from "@/lib/format";

type Balances = {
  hsk: null; // native, not implemented in dev page - skip
  mRwa: bigint;
  mUsdt: bigint;
};

export default function DevPage() {
  const { address, isRightChain } = useWallet();
  const [balances, setBalances] = useState<Pick<Balances, "mRwa" | "mUsdt"> | null>(null);
  const [kyc, setKyc] = useState<KycInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenMeta, setTokenMeta] = useState<{ rwaDecimals: number; usdtDecimals: number } | null>(null);

  // Proof smoke-test state (inlined from the old home page)
  const [bid, setBid] = useState("5000");
  const [reserve, setReserve] = useState("1000");
  const [escrow, setEscrow] = useState("10000");
  const [proofStatus, setProofStatus] = useState("idle");
  const [proofOutput, setProofOutput] = useState<string>("");

  const refresh = useCallback(async () => {
    if (!address) {
      setBalances(null);
      setKyc(null);
      return;
    }
    const [meta1, meta2, rwaBal, usdtBal, kycInfo] = await Promise.all([
      readErc20Metadata(addresses.mockRwa),
      readErc20Metadata(addresses.mockUsdt),
      readBalance(addresses.mockRwa, address),
      readBalance(addresses.mockUsdt, address),
      readIsHuman(address),
    ]);
    setTokenMeta({ rwaDecimals: meta1.decimals, usdtDecimals: meta2.decimals });
    setBalances({ mRwa: rwaBal, mUsdt: usdtBal });
    setKyc(kycInfo);
  }, [address]);

  useEffect(() => {
    refresh().catch((err) => setMessage(err instanceof Error ? err.message : String(err)));
  }, [refresh]);

  async function handleAction(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setMessage(null);
    try {
      await fn();
      setMessage(`${label}: ok`);
      await refresh();
    } catch (err) {
      setMessage(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  async function onProve() {
    setProofStatus("proving");
    setProofOutput("");
    const t0 = performance.now();
    try {
      const result = await generateAuctionProof({
        bid: BigInt(bid),
        reserve: BigInt(reserve),
        escrow: BigInt(escrow),
      });
      const t1 = performance.now();
      setProofOutput(
        JSON.stringify(
          {
            elapsedMs: Math.round(t1 - t0),
            proofBytes: result.proof.length,
            publicInputs: result.publicInputs,
            witnessLength: result.witnessLength,
          },
          null,
          2,
        ),
      );
      setProofStatus("ok");
    } catch (err) {
      setProofOutput(err instanceof Error ? err.message : String(err));
      setProofStatus("error");
    }
  }

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 720 }}>
      <h1>dev tools</h1>
      <p>
        <Link href="/">home</Link> · <Link href="/auctions">auctions</Link>
      </p>
      <section style={{ marginBottom: 16 }}>
        <WalletButton />
      </section>

      {!address && <p>connect a wallet to mint, self-kyc, or view balances.</p>}

      {address && (
        <>
          <section style={{ marginBottom: 24 }}>
            <h2>my state</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: 4 }}>
              <dt>address</dt>
              <dd>{shortAddress(address)}</dd>
              <dt>right chain</dt>
              <dd>{String(isRightChain)}</dd>
              <dt>kyc</dt>
              <dd>{kyc ? (kyc.isValid ? `approved (level ${kyc.level})` : "not approved") : "?"}</dd>
              <dt>mRWA balance</dt>
              <dd>
                {balances && tokenMeta
                  ? `${formatTokenAmount(balances.mRwa, tokenMeta.rwaDecimals)} mRWA`
                  : "?"}
              </dd>
              <dt>mUSDT balance</dt>
              <dd>
                {balances && tokenMeta
                  ? `${formatTokenAmount(balances.mUsdt, tokenMeta.usdtDecimals)} mUSDT`
                  : "?"}
              </dd>
            </dl>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2>actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                disabled={busy !== null}
                onClick={() =>
                  handleAction("mint 10 mRWA", () => mint(addresses.mockRwa, address, 10n * 10n ** 18n))
                }
              >
                mint 10 mRWA to me
              </button>
              <button
                disabled={busy !== null}
                onClick={() =>
                  handleAction("mint 1m mUSDT", () =>
                    mint(addresses.mockUsdt, address, 1_000_000n * 10n ** 6n),
                  )
                }
              >
                mint 1,000,000 mUSDT to me
              </button>
              <button
                disabled={busy !== null}
                onClick={() => handleAction("self-kyc level 1", () => selfKycMock(address, 1))}
              >
                self-kyc in mock sbt (level 1)
              </button>
            </div>
            {busy && <p>working: {busy}...</p>}
            {message && <pre>{message}</pre>}
          </section>
        </>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2>zk proof smoke-test</h2>
        <p>
          generates a browser proof for <code>reserve &lt;= bid &lt;= escrow</code>. no contract tx.
        </p>
        <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
          <label>
            bid (private):{" "}
            <input value={bid} onChange={(e) => setBid(e.target.value)} style={{ width: 120 }} />
          </label>
          <label>
            reserve (public):{" "}
            <input value={reserve} onChange={(e) => setReserve(e.target.value)} style={{ width: 120 }} />
          </label>
          <label>
            escrow (public):{" "}
            <input value={escrow} onChange={(e) => setEscrow(e.target.value)} style={{ width: 120 }} />
          </label>
          <button onClick={onProve} disabled={proofStatus === "proving"}>
            {proofStatus === "proving" ? "proving..." : "generate proof"}
          </button>
        </div>
        <p>status: {proofStatus}</p>
        <pre style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap" }}>{proofOutput}</pre>
      </section>
    </main>
  );
}
