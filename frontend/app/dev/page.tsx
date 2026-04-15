"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addresses } from "@/lib/addresses";
import { generateAuctionProof } from "@/lib/prove";
import { mint, readBalance, readErc20Metadata } from "@/lib/erc20";
import { readIsHuman, selfKycMock, type KycInfo } from "@/lib/kyc";
import { formatTokenAmount } from "@/lib/format";
import { SectionHeading, Pill } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
    <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20">
      <div className="mb-14">
        <SectionHeading
          label="Developer tools"
          title="Mint, self-KYC, and smoke-test a proof"
        />
        <p className="mt-5 max-w-2xl text-lg text-[#191A23]/70">
          This page is for hackathon judges and local testing. Production
          builds strip the test signer path.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        {/* My state — paper card */}
        <div className="rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-8 md:p-10">
          <h2 className="mb-8 text-[30px] font-medium leading-[1.2] text-[#191A23]">
            My state
          </h2>
          {!address && (
            <p className="text-base text-[#191A23]/70">
              Connect a wallet to see your balances.
            </p>
          )}
          {address && (
            <dl className="flex flex-col gap-5">
              <Row label="Address">
                <Address value={address} chars={6} />
              </Row>
              <Row label="Right chain">
                <Pill variant={isRightChain ? "green" : "white"}>
                  {String(isRightChain)}
                </Pill>
              </Row>
              <Row label="KYC">
                <Pill variant={kyc?.isValid ? "green" : "white"}>
                  {kyc
                    ? kyc.isValid
                      ? `level ${kyc.level}`
                      : "not approved"
                    : "?"}
                </Pill>
              </Row>
              <Row label="mRWA balance">
                <span className="font-mono text-[#191A23]">
                  {balances && tokenMeta
                    ? `${formatTokenAmount(
                        balances.mRwa,
                        tokenMeta.rwaDecimals,
                      )} mRWA`
                    : "?"}
                </span>
              </Row>
              <Row label="mUSDT balance">
                <span className="font-mono text-[#191A23]">
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

        {/* Actions — white card */}
        <div className="rounded-[45px] border border-[#191A23] bg-white p-8 md:p-10">
          <h2 className="mb-8 text-[30px] font-medium leading-[1.2] text-[#191A23]">
            Actions
          </h2>
          {!address && (
            <p className="text-base text-[#191A23]/70">
              Connect a wallet to mint and self-KYC.
            </p>
          )}
          {address && (
            <div className="flex flex-col gap-4">
              <Button
                variant="primary"
                size="default"
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
                size="default"
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
                variant="tertiary"
                size="default"
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
                <span className="font-mono text-sm text-[#191A23]/60">
                  working · {busy}…
                </span>
              )}
              {message && (
                <pre className="whitespace-pre-wrap rounded-[14px] border border-[#191A23]/15 bg-[#F3F3F3] px-4 py-3 font-mono text-sm text-[#191A23]">
                  {message}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ZK smoke test — ink card */}
      <div className="mt-10 rounded-[45px] border border-[#191A23] bg-[#191A23] p-8 md:p-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-[7px] py-[5px] text-base font-medium text-[#191A23]">
            ZK smoke test
          </span>
          <span className="font-mono text-sm text-white/50">
            reserve ≤ bid ≤ escrow
          </span>
        </div>
        <h2 className="mb-10 text-[30px] font-medium leading-[1.2] text-white">
          Generate a browser proof with no contract tx.
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-5">
            <div className="rounded-[24px] bg-white p-6">
              <Field
                label="Bid · private"
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                mono
                inputMode="numeric"
              />
            </div>
            <div className="rounded-[24px] bg-white p-6">
              <Field
                label="Reserve · public"
                value={reserve}
                onChange={(e) => setReserve(e.target.value)}
                mono
                inputMode="numeric"
              />
            </div>
            <div className="rounded-[24px] bg-white p-6">
              <Field
                label="Escrow · public"
                value={escrow}
                onChange={(e) => setEscrow(e.target.value)}
                mono
                inputMode="numeric"
              />
            </div>
            <Button
              variant="tertiary"
              size="default"
              onClick={onProve}
              disabled={proofStatus === "proving"}
            >
              {proofStatus === "proving" ? "proving…" : "Generate proof"}
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#B9FF66]">
              output · status {proofStatus}
            </span>
            <pre className="max-h-[520px] min-h-60 overflow-auto whitespace-pre-wrap rounded-[24px] border border-white/15 bg-black/40 px-6 py-5 font-mono text-sm leading-relaxed text-[#B9FF66]">
              {proofOutput || "// run the proof to populate"}
            </pre>
          </div>
        </div>
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
    <div className="flex items-center justify-between gap-3 border-b border-[#191A23]/10 pb-4 last:border-0 last:pb-0">
      <dt className="text-sm font-medium text-[#191A23]/60">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
