"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addresses } from "@/lib/addresses";
import { approve } from "@/lib/erc20";
import { createAuction } from "@/lib/auction";
import type { Address } from "viem";
import { SectionHeading, Pill } from "@/components/ui/heading";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function CreatePage() {
  const { address } = useWallet();
  const [asset, setAsset] = useState<string>(addresses.mockRwa);
  const [assetAmount, setAssetAmount] = useState("1000000000000000000");
  const [paymentToken, setPaymentToken] = useState<string>(addresses.mockUsdt);
  const [reserve, setReserve] = useState("1000");
  const [commitHours, setCommitHours] = useState("1");
  const [revealHours, setRevealHours] = useState("1");
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<string>("");

  async function onCreate() {
    setStatus("working");
    setLog("");
    try {
      setLog((l) => l + "approving asset token...\n");
      await approve(asset as Address, addresses.auction, BigInt(assetAmount));

      setLog((l) => l + "sending createAuction...\n");
      const hash = await createAuction({
        asset: asset as Address,
        assetAmount: BigInt(assetAmount),
        paymentToken: paymentToken as Address,
        reserve: BigInt(reserve),
        commitDuration: BigInt(commitHours) * 3600n,
        revealDuration: BigInt(revealHours) * 3600n,
      });
      setLog((l) => l + `createAuction tx: ${hash}\n`);
      setStatus("done");
    } catch (err) {
      setLog(
        (l) =>
          l + `error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20">
      <div className="mb-14">
        <SectionHeading
          label="Seller flow"
          title="Create a sealed-bid auction"
        />
        <p className="mt-5 max-w-2xl text-lg text-[#191A23]/70">
          Set the asset, the reserve, and the window. The auction contract
          enforces KYC level 1 and escrows the asset on creation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr] md:gap-10">
        {/* Form card */}
        <div className="rounded-[45px] border border-[#191A23] bg-[#F3F3F3] p-8 md:p-10">
          <h2 className="mb-8 text-[30px] font-medium leading-[1.2] text-[#191A23]">
            Auction parameters
          </h2>

          {!address && (
            <div className="rounded-[14px] border border-[#191A23]/20 bg-white px-6 py-5 text-base text-[#191A23]/70">
              Connect a wallet to create an auction.
            </div>
          )}

          {address && (
            <div className="grid gap-6">
              <Field
                label="Asset token"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                mono
              />
              <Field
                label="Asset amount · raw"
                value={assetAmount}
                onChange={(e) => setAssetAmount(e.target.value)}
                mono
                inputMode="numeric"
                hint="1e18 = 1 mRWA"
              />
              <Field
                label="Payment token"
                value={paymentToken}
                onChange={(e) => setPaymentToken(e.target.value)}
                mono
              />
              <Field
                label="Reserve · raw"
                value={reserve}
                onChange={(e) => setReserve(e.target.value)}
                mono
                inputMode="numeric"
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field
                  label="Commit window · hours"
                  value={commitHours}
                  onChange={(e) => setCommitHours(e.target.value)}
                  mono
                  inputMode="numeric"
                />
                <Field
                  label="Reveal window · hours"
                  value={revealHours}
                  onChange={(e) => setRevealHours(e.target.value)}
                  mono
                  inputMode="numeric"
                />
              </div>
              <Button
                variant="tertiary"
                size="default"
                onClick={onCreate}
                disabled={status === "working"}
              >
                {status === "working"
                  ? "working…"
                  : "Approve asset + create auction"}
              </Button>
              <div className="flex items-center gap-2">
                <Pill
                  variant={
                    status === "done"
                      ? "green"
                      : status === "error"
                        ? "black"
                        : "white"
                  }
                >
                  status · {status}
                </Pill>
              </div>
              {log && (
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-[14px] border border-[#191A23] bg-[#191A23] px-5 py-4 font-mono text-sm leading-relaxed text-[#B9FF66]">
                  {log}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Hints card — lime */}
        <div className="rounded-[45px] border border-[#191A23] bg-[#B9FF66] p-8 md:p-10">
          <h2 className="mb-6 text-[30px] font-medium leading-[1.2] text-[#191A23]">
            Before you publish
          </h2>
          <ul className="flex flex-col gap-4 text-base leading-relaxed text-[#191A23]/85">
            <Hint>
              The asset is escrowed when you create the auction. Approve the
              auction contract for at least <em>assetAmount</em>.
            </Hint>
            <Hint>
              Reserve is the minimum revealed bid the contract will accept
              at settle().
            </Hint>
            <Hint>
              Commit window should be longer than the slowest expected proof
              generation. 1 hour is safe.
            </Hint>
            <Hint>
              KYC is mandatory. Use the dev tools page to self-KYC on
              testnet.
            </Hint>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-[#191A23]" />
      <span>{children}</span>
    </li>
  );
}
