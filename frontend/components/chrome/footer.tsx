import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const EXPLORER = "https://hashkeychain-testnet-explorer.alt.technology";
const REPO = "https://github.com/IronicDeGawd/Haskkey-SealedHash";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-16 md:px-10 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
          <div className="flex flex-col gap-4">
            <Logo className="text-white" />
            <p className="max-w-sm text-[14px] leading-relaxed text-white/70">
              Sealed-bid auctions with on-chain solvency proofs. Built for
              HashKey Chain Horizon Hackathon — ZKID track.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
              Product
            </span>
            <Link href="/auctions" className="text-[14px] text-white/80 hover:text-lime">
              Browse auctions
            </Link>
            <Link href="/create" className="text-[14px] text-white/80 hover:text-lime">
              Create auction
            </Link>
            <Link href="/#how-it-works" className="text-[14px] text-white/80 hover:text-lime">
              How it works
            </Link>
            <Link href="/dev" className="text-[14px] text-white/80 hover:text-lime">
              Dev tools
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
              Resources
            </span>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-white/80 hover:text-lime"
            >
              GitHub repository
            </a>
            <a
              href={`${EXPLORER}/address/0x15dd37d92eD9526300FE5de5aB555AeA6C621f22`}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-white/80 hover:text-lime"
            >
              Auction contract
            </a>
            <a
              href="https://dorahacks.io/hackathon/2045"
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-white/80 hover:text-lime"
            >
              DoraHacks BUIDL
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-[12px] text-white/50 md:flex-row md:items-center">
          <span className="font-mono uppercase tracking-[0.12em]">
            Deployed on HashKey Chain Testnet · chainId 133
          </span>
          <span className="font-mono uppercase tracking-[0.12em]">
            © 2026 SealedHash
          </span>
        </div>
      </div>
    </footer>
  );
}
