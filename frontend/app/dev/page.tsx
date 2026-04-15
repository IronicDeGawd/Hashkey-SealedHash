"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addresses } from "@/lib/addresses";
import { generateAuctionProof } from "@/lib/prove";
import { mint, readBalance, readErc20Metadata } from "@/lib/erc20";
import { readIsHuman, selfKycMock, type KycInfo } from "@/lib/kyc";
import { formatTokenAmount } from "@/lib/format";
import { SectionHeading } from "@/components/ui/heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { Address } from "@/components/ui/address";

export default function DevPage() {
  const { address, isRightChain } = useWallet();
  const [balances, setBalances] = useState<{
    mRwa: bigint;
    mUsdt: bigint;
  } | null>(null);
  const [kyc, setKyc] = useState<KycInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenMeta, setTokenMeta] = useState<{
    rwaDecimals: number;
    usdtDecimals: number;
  } | null>(null);

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
    setTokenMeta({
      rwaDecimals: meta1.decimals,
      usdtDecimals: meta2.decimals,
    });
    setBalances({ mRwa: rwaBal, mUsdt: usdtBal });
    setKyc(kycInfo);
  }, [address]);

  useEffect(() => {
    refresh().catch((err) =>
      setMessage(err instanceof Error ? err.message : String(err)),
    );
  }, [refresh]);

  async function handleAction(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setMessage(null);
    try {
      await fn();
      setMessage(`${label}: ok`);
      await refresh();
    } catch (err) {
      setMessage(
        `${label}: ${err instanceof Error ? err.message : String(err)}`,
      );
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
    <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-10 md:py-20">
      <SectionHeading
        label="Developer tools"
        title="Mint, self-KYC, and smoke-test a proof."
        description="This page is for hackathon judges and local testing. Production builds strip the test signer path."
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Card variant="paper" hover={false}>
          <div className="flex flex-col gap-5">
            <CardTitle>My state</CardTitle>
            {!address && (
              <p className="text-[14px] text-ink/60">
                Connect a wallet to see your balances.
              </p>
            )}
            {address && (
              <dl className="grid gap-4 text-[13px]">
                <Row label="Address">
                  <Address value={address} chars={6} />
                </Row>
                <Row label="Right chain">
                  <Pill tone={isRightChain ? "lime" : "danger"}>
                    {String(isRightChain)}
                  </Pill>
                </Row>
                <Row label="KYC">
                  <Pill
                    tone={
                      kyc ? (kyc.isValid ? "lime" : "danger") : "paper"
                    }
                  >
                    {kyc
                      ? kyc.isValid
                        ? `level ${kyc.level}`
                        : "not approved"
                      : "?"}
                  </Pill>
                </Row>
                <Row label="mRWA balance">
                  <span className="font-mono text-ink">
                    {balances && tokenMeta
                      ? `${formatTokenAmount(
                          balances.mRwa,
                          tokenMeta.rwaDecimals,
                        )} mRWA`
                      : "?"}
                  </span>
                </Row>
                <Row label="mUSDT balance">
                  <span className="font-mono text-ink">
                    {balances && tokenMeta
                      ? `${formatTokenAmount(
                          balances.mUsdt,
                          tokenMeta.usdtDecimals,
                        )} mUSDT`
                      : "?"}
                  </span>
                </Row>
              </dl>
            )}
          </div>
        </Card>

        <Card variant="white" hover={false}>
          <div className="flex flex-col gap-5">
            <CardTitle>Actions</CardTitle>
            {!address && (
              <p className="text-[14px] text-ink/60">
                Connect a wallet to mint and self-KYC.
              </p>
            )}
            {address && (
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy !== null}
                  onClick={() =>
                    handleAction("mint 10 mRWA", () =>
                      mint(addresses.mockRwa, address, 10n * 10n ** 18n),
                    )
                  }
                >
                  Mint 10 mRWA to me
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy !== null}
                  onClick={() =>
                    handleAction("mint 1m mUSDT", () =>
                      mint(
                        addresses.mockUsdt,
                        address,
                        1_000_000n * 10n ** 6n,
                      ),
                    )
                  }
                >
                  Mint 1,000,000 mUSDT to me
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  disabled={busy !== null}
                  onClick={() =>
                    handleAction("self-kyc level 1", () =>
                      selfKycMock(address, 1),
                    )
                  }
                >
                  Self-KYC in mock SBT · level 1
                </Button>
                {busy && (
                  <span className="font-mono text-[12px] text-ink/60">
                    working · {busy}…
                  </span>
                )}
                {message && (
                  <pre className="whitespace-pre-wrap rounded-[10px] border border-ink/15 bg-paper px-3 py-2 font-mono text-[12px] text-ink">
                    {message}
                  </pre>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card variant="ink" hover={false}>
          <div className="flex flex-col gap-6 text-white">
            <div className="flex items-center gap-3">
              <Pill tone="lime">ZK smoke test</Pill>
              <span className="font-mono text-[12px] text-white/50">
                reserve ≤ bid ≤ escrow
              </span>
            </div>
            <CardTitle className="text-white">
              Generate a browser proof with no contract tx.
            </CardTitle>
            <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
              <div className="flex flex-col gap-4">
                <div className="rounded-[20px] bg-white p-5 text-ink">
                  <Field
                    label="Bid · private"
                    value={bid}
                    onChange={(e) => setBid(e.target.value)}
                    mono
                    inputMode="numeric"
                  />
                </div>
                <div className="rounded-[20px] bg-white p-5 text-ink">
                  <Field
                    label="Reserve · public"
                    value={reserve}
                    onChange={(e) => setReserve(e.target.value)}
                    mono
                    inputMode="numeric"
                  />
                </div>
                <div className="rounded-[20px] bg-white p-5 text-ink">
                  <Field
                    label="Escrow · public"
                    value={escrow}
                    onChange={(e) => setEscrow(e.target.value)}
                    mono
                    inputMode="numeric"
                  />
                </div>
                <Button
                  variant="accent"
                  size="lg"
                  onClick={onProve}
                  disabled={proofStatus === "proving"}
                >
                  {proofStatus === "proving"
                    ? "proving…"
                    : "Generate proof"}
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-lime">
                  output · status {proofStatus}
                </span>
                <pre className="max-h-[420px] min-h-60 overflow-auto whitespace-pre-wrap rounded-[20px] border border-white/15 bg-black/30 px-5 py-4 font-mono text-[12px] leading-relaxed text-lime">
                  {proofOutput || "// run the proof to populate"}
                </pre>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3 last:border-0 last:pb-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
