import { Display, Eyebrow } from "@/components/ui/heading";
import { LinkButton } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-white">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 py-16 md:grid-cols-[1.15fr_1fr] md:gap-10 md:px-10 md:py-24">
        <div className="flex flex-col gap-8">
          <Eyebrow>HashKey Chain · ZKID Track</Eyebrow>
          <Display>
            Sealed bids that prove
            <span className="relative mx-2 inline-block">
              <span className="absolute inset-0 -z-10 -skew-y-1 rounded-[8px] bg-lime" />
              their own
            </span>
            solvency.
          </Display>
          <p className="max-w-[52ch] text-[17px] leading-relaxed text-ink/70 md:text-[18px]">
            SealedHash is a sealed-bid auction protocol. Bidders commit to an
            encrypted amount, a Noir range proof convinces the chain the escrow
            covers the bid, and nothing leaks until the reveal window opens.
            No front-running, no MEV, no insolvent winners.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/auctions" variant="accent" size="lg">
              View live auctions
              <ArrowIcon />
            </LinkButton>
            <LinkButton href="#how-it-works" variant="outline" size="lg">
              How it works
            </LinkButton>
          </div>
          <dl className="mt-2 grid max-w-xl grid-cols-3 gap-6 border-t border-ink/10 pt-6">
            <Stat value="18.8s" label="cold proof" />
            <Stat value="16/16" label="foundry tests" />
            <Stat value="24 KB" label="auction contract" />
          </dl>
        </div>

        <HeroDiagram />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-display text-[28px] font-semibold leading-none tracking-tight text-ink">
        {value}
      </dt>
      <dd className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
        {label}
      </dd>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M8.5 3.5L13 8l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroDiagram() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute inset-4 -z-10 rounded-[45px] bg-lime" />
      <svg
        viewBox="0 0 520 520"
        className="h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Commit, prove, reveal diagram"
      >
        <rect
          x="2"
          y="2"
          width="516"
          height="516"
          rx="44"
          fill="var(--color-white)"
          stroke="var(--color-ink)"
          strokeWidth="3"
        />

        {/* step 1 — commit */}
        <g>
          <rect x="40" y="60" width="170" height="90" rx="18" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="2.5" />
          <text x="60" y="92" fontFamily="var(--font-display)" fontSize="14" fontWeight="600" fill="var(--color-ink)">01 · COMMIT</text>
          <text x="60" y="116" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink)">hash(amount,</text>
          <text x="60" y="131" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink)">nonce) →</text>
        </g>
        <path d="M220 105 L270 105" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M263 100 L272 105 L263 110" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* step 2 — prove */}
        <g>
          <rect x="280" y="60" width="200" height="90" rx="18" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="2.5" />
          <text x="300" y="92" fontFamily="var(--font-display)" fontSize="14" fontWeight="600" fill="var(--color-ink)">02 · PROVE</text>
          <text x="300" y="116" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink)">noir range proof</text>
          <text x="300" y="131" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink)">min ≤ bid ≤ escrow</text>
        </g>

        {/* arrow down */}
        <path d="M380 165 L380 210" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M375 203 L380 212 L385 203" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* commit ledger block */}
        <g>
          <rect x="70" y="200" width="380" height="100" rx="18" fill="var(--color-ink)" />
          <text x="90" y="232" fontFamily="var(--font-display)" fontSize="14" fontWeight="600" fill="var(--color-lime)">SEALED STATE</text>
          <text x="90" y="256" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-white)">commitHash: 0x4f…92a</text>
          <text x="90" y="272" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-white)">escrow:     1200 mUSDT</text>
          <text x="90" y="288" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-white)">bid:        ???</text>
        </g>

        {/* arrow to reveal */}
        <path d="M260 315 L260 360" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M255 353 L260 362 L265 353" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* step 3 — reveal */}
        <g>
          <rect x="40" y="370" width="440" height="110" rx="18" fill="var(--color-white)" stroke="var(--color-ink)" strokeWidth="2.5" />
          <text x="60" y="402" fontFamily="var(--font-display)" fontSize="14" fontWeight="600" fill="var(--color-ink)">03 · REVEAL</text>
          <text x="60" y="428" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink)">window opens · bidder reveals (amount, nonce)</text>
          <text x="60" y="446" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink)">contract recomputes hash · highest wins · losers refund</text>
          <rect x="60" y="454" width="60" height="18" rx="9" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="1.5" />
          <text x="70" y="467" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600" fill="var(--color-ink)">SETTLED</text>
        </g>
      </svg>
    </div>
  );
}
