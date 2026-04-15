import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { addresses } from "@/lib/addresses";

const EXPLORER = "https://hashkeychain-testnet-explorer.alt.technology";
const REPO = "https://github.com/IronicDeGawd/Haskkey-SealedHash";
const DORAHACKS = "https://dorahacks.io/hackathon/2045";

const navLinks = [
  { href: "/auctions", label: "Auctions" },
  { href: "/create", label: "Create" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/dev", label: "Dev tools" },
];

export function Footer() {
  return (
    <footer className="bg-[#191A23] py-14">
      <div className="mx-auto max-w-[1440px] px-5 md:px-16">
        {/* Top row */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-white/20 pb-10 md:flex-row md:items-center">
          <Logo variant="light" />

          <nav className="flex flex-wrap items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base text-white underline underline-offset-4 hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:border-[#B9FF66] hover:text-[#B9FF66]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.93c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.38-3.88-1.38-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </a>
            <a
              href={`${EXPLORER}/address/${addresses.auction}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Auction contract on explorer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:border-[#B9FF66] hover:text-[#B9FF66]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 4v16" />
              </svg>
            </a>
            <a
              href={DORAHACKS}
              target="_blank"
              rel="noreferrer"
              aria-label="DoraHacks BUIDL"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:border-[#B9FF66] hover:text-[#B9FF66]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z" />
                <path d="M12 22V12M3 6.5L12 12M21 6.5L12 12" />
              </svg>
            </a>
          </div>
        </div>

        {/* Middle row */}
        <div className="flex flex-col items-start justify-between gap-8 py-10 md:flex-row">
          <div className="flex max-w-md flex-col gap-4">
            <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-[7px] py-[5px] text-base font-medium text-[#191A23]">
              The quick pitch
            </span>
            <p className="text-base leading-relaxed text-white">
              Sealed-bid auctions with on-chain solvency proofs. Bidders
              commit, a Noir range proof shows escrow ≥ bid, reveals open
              after the window, losers refund. MEV-resistant, KYC-gated,
              fully on-chain.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-[14px] bg-[#292A32] p-6">
            <span className="text-base font-medium text-white">
              HashKey Chain Testnet
            </span>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <span>chainId 133</span>
              <span>
                Auction contract:{" "}
                <span className="font-mono text-[#B9FF66]">
                  0x15dd…1f22
                </span>
              </span>
              <span>Built for HashKey Horizon Hackathon — ZKID track</span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col items-start gap-4 border-t border-white/20 pt-8 md:flex-row md:items-center md:gap-8">
          <p className="text-base text-white/60">
            © 2026 SealedHash. All Rights Reserved.
          </p>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="text-base text-white underline underline-offset-4 hover:opacity-70"
          >
            Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
