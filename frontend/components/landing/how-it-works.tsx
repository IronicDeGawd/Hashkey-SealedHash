"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/plus-icon";
import { cn } from "@/lib/cn";

const steps = [
  {
    number: "01",
    title: "Seller creates the auction",
    description:
      "The seller escrows an RWA token into SealedBidAuction, sets a minimum bid and a commit/reveal window. Auction creation is gated on KYC SBT level 1 and enforces EIP-170 bytecode limits. A new auctionId is emitted on-chain.",
  },
  {
    number: "02",
    title: "Bidder proves solvency in the browser",
    description:
      "The bidder approves an mUSDT escrow and generates a Noir UltraHonk range proof client-side. The circuit asserts min ≤ amount ≤ escrow. Only the commitment hash and the proof leave the tab — the bid amount never does.",
  },
  {
    number: "03",
    title: "Commit locks escrow on-chain",
    description:
      "A single transaction deposits the escrow, verifies the proof on-chain via HonkVerifier, and stores the commitmentHash in contract state. The nonce is persisted in localStorage under a versioned key so the bidder can always reveal later.",
  },
  {
    number: "04",
    title: "Reveal window opens",
    description:
      "Once the commit window closes, bidders return and reveal (amount, nonce). The contract recomputes hash(amount, nonce) and confirms it matches the sealed commitment. Invalid reveals are rejected; valid reveals update the highest-bid state.",
  },
  {
    number: "05",
    title: "Anyone settles the auction",
    description:
      "Settlement is permissionless. After the reveal window closes, any address can call settle() — the highest valid reveal wins, the RWA transfers to the winner, the seller is paid from escrow, and the winner's escrow surplus is refunded atomically.",
  },
  {
    number: "06",
    title: "Losers refund, winner keeps the asset",
    description:
      "Non-winning escrows are refundable with a single refund() call. A winner who never reveals forfeits their escrow to the seller. Because the KYC SBT is non-transferable, sybils can't game the system across auctions.",
  },
];

export function HowItWorks() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20"
    >
      <div className="mb-14 flex items-start gap-10">
        <div className="flex flex-col gap-5">
          <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-[7px] py-[5px] text-xl font-medium text-[#191A23]">
            How it works
          </span>
          <h2 className="text-[32px] font-medium leading-[1.2] text-[#191A23] md:text-[40px]">
            Commit. Prove. Reveal. Settle.
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {steps.map((step, i) => {
          const isOpen = open === i;
          return (
            <div
              key={step.number}
              className={cn(
                "rounded-[45px] border border-[#191A23] px-6 py-6 transition-colors md:px-12 md:py-8",
                isOpen ? "bg-[#B9FF66]" : "bg-[#F3F3F3]"
              )}
            >
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="text-[36px] font-medium leading-none text-[#191A23] md:text-[60px]">
                    {step.number}
                  </span>
                  <span className="text-lg font-medium text-[#191A23] md:text-2xl">
                    {step.title}
                  </span>
                </div>
                <PlusIcon icon={isOpen ? "minus" : "plus"} size={58} />
              </button>

              {isOpen && (
                <>
                  <hr className="my-6 border-[#191A23]/30" />
                  <p className="text-base leading-relaxed text-[#191A23]/80">
                    {step.description}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
