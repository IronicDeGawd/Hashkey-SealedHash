"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addresses } from "@/lib/addresses";
import { approve } from "@/lib/erc20";
import { createAuction } from "@/lib/auction";
import type { Address } from "viem";
import { SectionHeading } from "@/components/ui/heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

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
    <div className="mx-auto max-w-[1000px] px-5 py-16 md:px-10 md:py-20">
      <SectionHeading
        label="Seller flow"
        title="Create a sealed-bid auction."
        description="Set the asset, the reserve, and the window. The auction contract enforces KYC level 1 and escrows the asset on creation."
      />

      <div className="mt-12 grid gap-8 md:grid-cols-[1fr_320px]">
        <Card variant="paper" hover={false}>
          <div className="flex flex-col gap-6">
            <CardTitle>Auction parameters</CardTitle>

            {!address && (
              <div className="rounded-[14px] border border-ink/15 bg-white px-5 py-4 text-[14px] text-ink/70">
                Connect a wallet to create an auction.
              </div>
            )}

            {address && (
              <div className="grid gap-5">
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
                <div className="grid gap-5 md:grid-cols-2">
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
                  variant="accent"
                  size="lg"
                  onClick={onCreate}
                  disabled={status === "working"}
                >
                  {status === "working"
                    ? "working…"
                    : "Approve asset + create auction"}
                </Button>
                <div className="flex items-center gap-2">
                  <Pill
                    tone={
                      status === "done"
                        ? "lime"
                        : status === "error"
                          ? "danger"
                          : "paper"
                    }
                  >
                    status · {status}
                  </Pill>
                </div>
                {log && (
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-[14px] border border-ink/20 bg-ink px-4 py-3 font-mono text-[12px] leading-relaxed text-lime">
                    {log}
                  </pre>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card variant="lime" hover={false}>
          <div className="flex flex-col gap-4">
            <CardTitle className="text-[22px]">Before you publish</CardTitle>
            <ul className="flex flex-col gap-3 text-[14px] text-ink/80">
              <Hint>
                The asset is escrowed when you create the auction. Approve
                the auction contract for at least <em>assetAmount</em>.
              </Hint>
              <Hint>
                Reserve is the minimum revealed bid the contract will accept
                at settle().
              </Hint>
              <Hint>
                Commit window should be longer than the slowest expected
                proof generation. 1 hour is safe.
              </Hint>
              <Hint>
                KYC is mandatory. Use the dev tools page to self-KYC on
                testnet.
              </Hint>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
      <span>{children}</span>
    </li>
  );
}
