"use client";

import * as React from "react";
import { SectionHeading } from "@/components/ui/heading";
import { PlusIcon } from "@/components/ui/plus-icon";
import { cn } from "@/lib/cn";

const steps = [
  {
    n: "01",
    title: "Seller creates the auction",
    body: "Seller escrows the RWA token, sets a minimum bid, pick a commit and reveal window. The contract enforces EIP-170 bytecode limits and KYC-SBT level 1 for every participant.",
  },
  {
    n: "02",
    title: "Bidder proves solvency in the browser",
    body: "Bidder approves an mUSDT escrow and generates a Noir UltraHonk proof client-side — 18.8s cold, sub-second warm. The circuit asserts min ≤ amount ≤ escrow. Only the commitment hash and proof leave the tab.",
  },
  {
    n: "03",
    title: "Commit locks the escrow on-chain",
    body: "A single transaction deposits the escrow, verifies the proof on-chain via HonkVerifier, and stores the commitmentHash. The nonce is persisted in localStorage under a versioned key so the bidder can always reveal later.",
  },
  {
    n: "04",
    title: "Reveal window opens",
    body: "After the commit window closes, bidders return and reveal (amount, nonce). The contract recomputes hash(amount, nonce) and confirms it matches the sealed commitment. Invalid reveals are rejected.",
  },
  {
    n: "05",
    title: "Anyone settles the auction",
    body: "Settlement is permissionless. Once the reveal window closes, any address can call settle() — the highest valid reveal wins, the RWA transfers to the winner, the seller is paid from escrow.",
  },
  {
    n: "06",
    title: "Losers refund, winner keeps the asset",
    body: "Non-winning escrows are refundable with a single transaction. A winner who never reveals forfeits their escrow to the seller. The KYC SBT is non-transferable so sybils cannot game the system.",
  },
];

export function HowItWorks() {
  const [open, setOpen] = React.useState<number>(1);
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28"
    >
      <SectionHeading
        label="How it works"
        title="Commit. Prove. Reveal. Settle."
        description="Six steps from posting an auction to paying out. Everything the bidder sees runs in the browser."
      />
      <div className="mt-14 flex flex-col gap-5">
        {steps.map((s, i) => {
          const isOpen = open === i;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className={cn(
                "group rounded-[45px] border border-ink px-6 py-6 text-left shadow-[0_5px_0_0_theme(colors.ink)] transition-colors md:px-12 md:py-8",
                isOpen ? "bg-lime" : "bg-paper hover:bg-lime/30"
              )}
            >
              <div className="flex items-center gap-4 md:gap-8">
                <span className="font-display text-[36px] font-semibold leading-none tracking-tight text-ink md:text-[52px]">
                  {s.n}
                </span>
                <span className="flex-1 font-display text-[20px] font-semibold leading-tight tracking-tight text-ink md:text-[28px]">
                  {s.title}
                </span>
                <PlusIcon open={isOpen} size={48} />
              </div>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr] pt-6" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-ink/20 pt-5 text-[15px] leading-relaxed text-ink/80 md:pl-[72px]">
                    {s.body}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
