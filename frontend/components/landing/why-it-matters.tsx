import { SectionHeading } from "@/components/ui/heading";
import { cn } from "@/lib/cn";

type FeatureCardProps = {
  tag: string;
  title: string;
  body: string;
  bg: string;
  labelBg: string;
  textColor: string;
  arrowBg: string;
  arrowText: string;
};

const features: FeatureCardProps[] = [
  {
    tag: "Bid privacy",
    title: "Sealed-bid commitments",
    body: "Bidders commit to hash(amount, nonce). Nobody sees the amount until reveal — not other bidders, not the seller, not the mempool.",
    bg: "bg-[#F3F3F3]",
    labelBg: "bg-[#B9FF66]",
    textColor: "text-[#191A23]",
    arrowBg: "bg-[#191A23]",
    arrowText: "text-white",
  },
  {
    tag: "Noir range proof",
    title: "Solvency without disclosure",
    body: "A Noir circuit asserts min_bid ≤ amount ≤ escrowed USDT in the browser. The chain verifies the proof on commit. Solvency is proven; the amount stays secret.",
    bg: "bg-[#B9FF66]",
    labelBg: "bg-white",
    textColor: "text-[#191A23]",
    arrowBg: "bg-[#191A23]",
    arrowText: "text-white",
  },
  {
    tag: "Permissionless settle",
    title: "Anyone can settle",
    body: "After the reveal window, any address can call settle(). The highest valid reveal wins, the asset transfers, the seller is paid from escrow, the winner's surplus is returned atomically.",
    bg: "bg-[#191A23]",
    labelBg: "bg-white",
    textColor: "text-white",
    arrowBg: "bg-[#B9FF66]",
    arrowText: "text-[#191A23]",
  },
  {
    tag: "KYC SBT gating",
    title: "Non-transferable identity",
    body: "The auction contract requires a KYC SBT at level ≥ 1 for every bidder. Sybils can't grief auctions, and the SBT is non-transferable so identity stays bound to the address.",
    bg: "bg-[#F3F3F3]",
    labelBg: "bg-[#B9FF66]",
    textColor: "text-[#191A23]",
    arrowBg: "bg-[#191A23]",
    arrowText: "text-white",
  },
  {
    tag: "Client-side proving",
    title: "18.8s cold proof",
    body: "UltraHonk proving runs in the browser via @aztec/bb.js. Cold proof generation is ~18.8s, warm proofs are sub-second. No server-side prover, no trusted relayer.",
    bg: "bg-[#B9FF66]",
    labelBg: "bg-white",
    textColor: "text-[#191A23]",
    arrowBg: "bg-[#191A23]",
    arrowText: "text-white",
  },
  {
    tag: "24 KB contract",
    title: "EIP-170 compliant",
    body: "SealedBidAuction is 24,252 bytes — just inside EIP-170's 24,576 byte cap. 16/16 Foundry tests passing including fuzz, reveal edge cases, and settle permissionlessness.",
    bg: "bg-[#191A23]",
    labelBg: "bg-white",
    textColor: "text-white",
    arrowBg: "bg-[#B9FF66]",
    arrowText: "text-[#191A23]",
  },
];

export function WhyItMatters() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20">
      <div className="mb-14 flex items-start gap-10">
        <SectionHeading
          label="What you get"
          title="Sealed bids, solvency proofs, on-chain settlement"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  tag,
  title,
  body,
  bg,
  labelBg,
  textColor,
  arrowBg,
  arrowText,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-8 rounded-[45px] border border-[#191A23] p-8 md:p-10",
        bg
      )}
    >
      <div className="flex flex-col gap-6">
        <span
          className={cn(
            "inline-block w-fit rounded-[7px] px-[7px] py-[5px] text-lg font-medium text-[#191A23] md:text-xl",
            labelBg
          )}
        >
          {tag}
        </span>
        <h3
          className={cn(
            "text-[24px] font-medium leading-[1.25] md:text-[28px]",
            textColor
          )}
        >
          {title}
        </h3>
        <p className={cn("text-base leading-relaxed", textColor, "opacity-80")}>
          {body}
        </p>
      </div>

      <a
        href="#how-it-works"
        className={cn("inline-flex items-center gap-3 text-base font-medium", textColor)}
      >
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            arrowBg
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={arrowText}>
            <path
              d="M2 8h12M10 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Learn more
      </a>
    </div>
  );
}
