"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useWallet } from "@/lib/wallet-context";
import { generateAuctionProof } from "@/lib/prove";
import { readAllowance, approve } from "@/lib/erc20";
import { commitBid } from "@/lib/auction";
import { readIsHuman, selfKycMock } from "@/lib/kyc";
import { addresses } from "@/lib/addresses";
import { randomNonce, computeCommitment, saveNonce } from "@/lib/commitment";
import { hashkeyTestnet } from "@/lib/chain";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";

type Props = {
  auctionId: bigint;
  reserve: bigint;
  paymentToken: Address;
  paymentDecimals: number;
};

type Step =
  | "idle"
  | "kyc"
  | "approve"
  | "proving"
  | "committing"
  | "done"
  | "error";

export function CommitForm({
  auctionId,
  reserve,
  paymentToken,
  paymentDecimals,
}: Props) {
  const { address } = useWallet();
  const [bid, setBid] = useState("5000");
  const [escrow, setEscrow] = useState("10000");
  const [step, setStep] = useState<Step>("idle");
  const [log, setLog] = useState<string>("");
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [kycOk, setKycOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!address) return;
    Promise.all([
      readAllowance(paymentToken, address, addresses.auction),
      readIsHuman(address),
    ])
      .then(([a, k]) => {
        setAllowance(a);
        setKycOk(k.isValid);
      })
      .catch((err) => setLog((l) => l + `read error: ${String(err)}\n`));
  }, [address, paymentToken]);

  async function onCommit() {
    if (!address) return;
    setLog("");
    setStep("idle");

    const bidBig = BigInt(bid);
    const escrowBig = BigInt(escrow);

    if (bidBig < reserve) {
      setLog("bid is below reserve - circuit would reject\n");
      setStep("error");
      return;
    }
    if (bidBig > escrowBig) {
      setLog("bid is greater than escrow - circuit would reject\n");
      setStep("error");
      return;
    }
    if (escrowBig < reserve) {
      setLog("escrow is below reserve - contract would reject\n");
      setStep("error");
      return;
    }

    try {
      // 1. KYC
      if (kycOk === false) {
        setStep("kyc");
        setLog((l) => l + "self-kyc in mock sbt...\n");
        await selfKycMock(address, 1);
        setKycOk(true);
      }

      // 2. Approve if needed
      if (allowance === null || allowance < escrowBig) {
        setStep("approve");
        setLog((l) => l + `approving ${escrow} of payment token...\n`);
        await approve(paymentToken, addresses.auction, escrowBig);
        setAllowance(escrowBig);
      }

      // 3. Nonce + commitment + persist BEFORE any network call that could lose state
      const nonce = randomNonce();
      const commitment = computeCommitment(bidBig, nonce);
      saveNonce({
        chainId: hashkeyTestnet.id,
        auction: addresses.auction,
        auctionId,
        bidder: address,
        bid: bidBig,
        nonce,
      });
      setLog(
        (l) =>
          l +
          `nonce + commitment saved to localStorage\ncommitment=${commitment}\n`,
      );

      // 4. Generate proof
      setStep("proving");
      setLog((l) => l + "generating zk proof (client-side)...\n");
      const t0 = performance.now();
      const { proof, publicInputs } = await generateAuctionProof({
        bid: bidBig,
        reserve,
        escrow: escrowBig,
      });
      const t1 = performance.now();
      setLog(
        (l) =>
          l +
          `proof ok in ${Math.round(t1 - t0)}ms, ${proof.length} bytes, public inputs ${publicInputs.join(", ")}\n`,
      );

      // 5. Commit tx
      setStep("committing");
      setLog((l) => l + "sending commitBid tx...\n");
      const hash = await commitBid(auctionId, escrowBig, commitment, proof);
      setLog((l) => l + `commitBid tx: ${hash}\n`);
      setStep("done");
    } catch (err) {
      setLog(
        (l) =>
          l + `error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      setStep("error");
    }
  }

  const needsKyc = kycOk === false;
  const needsApproval =
    allowance !== null && allowance < BigInt(escrow || "0");
  const working =
    step === "proving" ||
    step === "committing" ||
    step === "approve" ||
    step === "kyc";

  const buttonLabel = working
    ? `working · ${step}…`
    : needsKyc
      ? "Self-KYC + approve + prove + commit"
      : needsApproval
        ? "Approve + prove + commit"
        : "Generate proof + commit";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={kycOk ? "lime" : kycOk === false ? "danger" : "paper"}>
          kyc · {kycOk === null ? "?" : kycOk ? "ok" : "not approved"}
        </Pill>
        <Pill tone="paper">
          allowance · {allowance === null ? "?" : allowance.toString()}
        </Pill>
        <Pill tone="white">reserve ≥ {reserve.toString()}</Pill>
      </div>

      <div className="grid gap-4 md:max-w-md">
        <Field
          label="Bid · private · raw units"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
          mono
          inputMode="numeric"
          hint="Hidden from the chain until reveal."
        />
        <Field
          label="Escrow · public · raw units"
          value={escrow}
          onChange={(e) => setEscrow(e.target.value)}
          mono
          inputMode="numeric"
          hint={`Payment token uses ${paymentDecimals} decimals. Raw integers only.`}
        />
        <Button
          variant="accent"
          size="lg"
          onClick={onCommit}
          disabled={working}
        >
          {buttonLabel}
        </Button>
      </div>

      {log && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-[14px] border border-ink/20 bg-ink px-4 py-3 font-mono text-[12px] leading-relaxed text-lime">
          {log}
        </pre>
      )}
    </div>
  );
}
