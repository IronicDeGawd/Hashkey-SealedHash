import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Pill } from "@/components/ui/heading";

export const metadata = {
  title: "How SealedHash works — sealed-bid auctions with solvency proofs",
  description:
    "A walk-through of the SealedHash sealed-bid auction protocol: commit, prove, reveal, settle.",
};

export default function HowItWorksPage() {
  return (
    <>
      <ArticleHero />
      <ArticleBody />
      <RelatedLinks />
    </>
  );
}

/* ─── Article hero ──────────────────────────────────────────────────────── */

function ArticleHero() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-10 px-5 pb-16 pt-10 md:flex-row md:items-start md:gap-16 md:px-16">
        {/* Illustration */}
        <div className="flex-shrink-0 md:w-[420px]">
          <svg
            viewBox="0 0 420 340"
            fill="none"
            className="h-full w-full"
            aria-hidden="true"
          >
            {/* Outer dashed circle */}
            <circle
              cx="210"
              cy="170"
              r="140"
              stroke="#191A23"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              fill="none"
            />
            {/* Envelope */}
            <rect
              x="100"
              y="110"
              width="220"
              height="140"
              rx="14"
              fill="#F3F3F3"
              stroke="#191A23"
              strokeWidth="3"
            />
            <path
              d="M100 130 L210 200 L320 130"
              stroke="#191A23"
              strokeWidth="3"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Wax seal — lime circle with star */}
            <circle
              cx="210"
              cy="200"
              r="30"
              fill="#B9FF66"
              stroke="#191A23"
              strokeWidth="3"
            />
            <path
              d="M210 184 l4 12 12 4-12 4-4 12-4-12-12-4 12-4Z"
              fill="#191A23"
            />
            {/* Accent stars */}
            <path
              d="M360 60 l6 18 18 6-18 6-6 18-6-18-18-6 18-6Z"
              fill="#191A23"
            />
            <path
              d="M40 280 l5 14 14 5-14 5-5 14-5-14-14-5 14-5Z"
              fill="#B9FF66"
              stroke="#191A23"
              strokeWidth="1.5"
            />
            <circle
              cx="370"
              cy="260"
              r="18"
              fill="#B9FF66"
              stroke="#191A23"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Meta + title */}
        <div className="flex flex-col gap-6 pt-2 md:pt-8">
          <div className="flex flex-wrap items-center gap-3">
            <Pill variant="green">Protocol</Pill>
            <span className="text-sm text-[#191A23]/50">·</span>
            <span className="text-sm text-[#191A23]/50">9 min read</span>
            <span className="text-sm text-[#191A23]/50">·</span>
            <span className="text-sm text-[#191A23]/50">Updated April 2026</span>
          </div>

          <h1 className="text-[40px] font-medium leading-[1.1] text-[#191A23] md:text-[56px] md:leading-[1.05]">
            How SealedHash turns a sealed bid into an on-chain solvency proof
          </h1>

          <p className="max-w-[640px] text-lg text-[#191A23]/70">
            An end-to-end walk through the commit, prove, reveal, and settle
            phases — what happens in the browser, what hits the chain, and
            why the bid amount never leaks.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#191A23] bg-[#B9FF66] text-base font-semibold text-[#191A23]">
              SH
            </div>
            <div>
              <p className="text-sm font-medium text-[#191A23]">
                SealedHash Protocol
              </p>
              <p className="text-sm text-[#191A23]/50">
                Built for HashKey Horizon Hackathon
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Article body ──────────────────────────────────────────────────────── */

function ArticleBody() {
  return (
    <article className="mx-auto max-w-[860px] px-5 pb-20 md:px-16">
      <div className="flex flex-col gap-8 text-[#191A23]">
        <p className="text-lg leading-relaxed text-[#191A23]/80">
          Sealed-bid auctions are old technology. The new part is making
          them trust-minimised on a public blockchain without leaking the
          bid amount, without trusting an operator, and without letting a
          non-solvent bidder grief the auction by committing to a number
          they can&apos;t pay. SealedHash threads all three needles using a
          Noir range proof, an on-chain verifier, and a commit-reveal
          lifecycle.
        </p>

        <h2 className="mt-6 text-[28px] font-medium text-[#191A23] md:text-[30px]">
          The problem with naive on-chain auctions
        </h2>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          Put an English auction on a public chain and every bid becomes
          instantly visible in the mempool. A competitor watches for the
          current highest bid, outbids by the smallest possible increment,
          and bumps the gas price. Honest bidders get front-run out of the
          market before their transaction even reaches a block.
        </p>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          A commit-reveal scheme fixes the mempool leak: bidders commit to
          <span className="font-mono"> hash(amount, nonce)</span> in one
          transaction, then reveal the pre-image in a second transaction
          after the commit window closes. But commit-reveal on its own
          doesn&apos;t guarantee solvency. Nothing stops a bidder from
          committing to a number they can&apos;t actually pay — at reveal
          time, the auction is either grief&apos;d or the protocol has to
          fall back to second-price, whichever is worse.
        </p>

        <h2 className="mt-6 text-[28px] font-medium text-[#191A23] md:text-[30px]">
          The SealedHash lifecycle
        </h2>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          SealedHash composes four distinct phases. Each phase has a clear
          on-chain state transition and a specific role for the user&apos;s
          browser.
        </p>

        {/* Phase 1 — commit */}
        <PhaseBlock
          number="01"
          title="Commit"
          actor="Bidder"
          what="hash(amount, nonce), escrow, proof → on-chain"
          body="The bidder picks a bid amount, generates a random 256-bit nonce in the browser, and computes the commitment as a Poseidon hash over the pair. The nonce is persisted to localStorage under the versioned key hashkey-sealed-bid-v1 before any network call — so even if the commit tx fails, the bidder can still reveal later. In the same transaction the bidder approves and transfers an mUSDT escrow to SealedBidAuction. The escrow must cover the bid."
        />

        {/* Phase 2 — prove */}
        <PhaseBlock
          number="02"
          title="Prove"
          actor="Bidder (in-browser)"
          what="Noir circuit → UltraHonk proof bytes"
          body="Before the commit tx is submitted, the bidder generates a zero-knowledge proof via @aztec/bb.js running locally in the browser. The Noir circuit asserts three constraints: hash(amount, nonce) == commitment, amount ≥ reserve_price, and amount ≤ escrow. Cold proving takes ~18.8s in the hackathon build; warm proving is sub-second. The only output that leaves the tab is the proof bytes plus the commitment hash. The bid amount never crosses the WebSocket."
        />

        {/* Phase 3 — reveal */}
        <PhaseBlock
          number="03"
          title="Reveal"
          actor="Bidder"
          what="(amount, nonce) → on-chain"
          body="Once the commit window closes, the reveal window opens. The bidder publishes (amount, nonce) to the auction contract. The contract recomputes hash(amount, nonce) and verifies it matches the stored commitment. If it does, the reveal is accepted and the auction state updates the highest-bid pointer. If the bidder disappears — loses their nonce, forgets to reveal — their commit is discarded and their escrow is forfeit to the seller at settlement."
        />

        {/* Phase 4 — settle */}
        <PhaseBlock
          number="04"
          title="Settle"
          actor="Anyone"
          what="asset → winner · escrow → seller · surplus → winner"
          body="Settlement is permissionless. After the reveal window closes, any address can call settle(). The contract walks the revealed bids, picks the highest valid one, transfers the asset to the winner, pays the seller from the winner's escrow, and returns the winner's escrow surplus atomically in the same transaction. Non-winning bidders refund their escrow with a separate refund() call."
        />

        <h2 className="mt-10 text-[28px] font-medium text-[#191A23] md:text-[30px]">
          Why the range proof is load-bearing
        </h2>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          The single most important property SealedHash adds on top of
          commit-reveal is <em>provable solvency without disclosure</em>.
          The Noir circuit does the heavy lifting — by asserting
          <span className="font-mono"> min ≤ amount ≤ escrow</span> in zero
          knowledge, it lets the chain reject insolvent commits at commit
          time, not reveal time. Griefing attacks — committing to a number
          you can&apos;t pay to skew auction state — are blocked before
          they can land.
        </p>

        {/* Comparison block — commit-reveal vs SealedHash */}
        <div className="my-10 grid grid-cols-1 overflow-hidden rounded-[30px] border border-[#191A23] md:grid-cols-2">
          <div className="bg-[#191A23] p-8 md:p-10">
            <h3 className="mb-6 text-xl font-medium text-[#B9FF66]">
              Commit-reveal only
            </h3>
            <ul className="flex flex-col gap-4 text-base text-white/80">
              <Bullet dot="#B9FF66">Bid amounts hidden until reveal</Bullet>
              <Bullet dot="#B9FF66">
                Insolvent bids accepted — grief risk
              </Bullet>
              <Bullet dot="#B9FF66">
                Reveal-phase fallback logic required
              </Bullet>
              <Bullet dot="#B9FF66">
                Auction state can be corrupted by no-shows
              </Bullet>
            </ul>
          </div>
          <div className="bg-[#B9FF66] p-8 md:p-10">
            <h3 className="mb-6 text-xl font-medium text-[#191A23]">
              SealedHash
            </h3>
            <ul className="flex flex-col gap-4 text-base text-[#191A23]/80">
              <Bullet dot="#191A23">Bid amounts hidden until reveal</Bullet>
              <Bullet dot="#191A23">
                Range proof rejects insolvent commits at commit time
              </Bullet>
              <Bullet dot="#191A23">
                Single reveal path, no fallback logic
              </Bullet>
              <Bullet dot="#191A23">
                No-shows forfeit escrow to seller automatically
              </Bullet>
            </ul>
          </div>
        </div>

        <h2 className="mt-4 text-[28px] font-medium text-[#191A23] md:text-[30px]">
          The trust model
        </h2>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          SealedHash has no operator, no relayer, and no trusted third
          party. The contracts enforce every transition. Proof generation
          runs in the bidder&apos;s browser via WebAssembly — there is no
          server-side prover to bribe or subpoena. The only party you have
          to trust is the HashKey Chain Testnet itself, and the Noir
          circuit spec that was used to build the on-chain
          <span className="font-mono"> HonkVerifier</span>. Both are open
          source in the repo.
        </p>

        <h2 className="mt-6 text-[28px] font-medium text-[#191A23] md:text-[30px]">
          Where the KYC SBT fits
        </h2>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          Anonymous sealed bids on their own create a sybil problem:
          spammers can create ten addresses and spam commit transactions
          to exhaust the auction&apos;s state storage. The auction
          contract requires every bidder and every seller to hold a
          non-transferable KYC SBT at level ≥ 1. On testnet the SBT is a
          self-mint mock; on a production deployment it would be issued by
          a KYC provider. Because the SBT is non-transferable, identity
          stays bound to the address forever — a sybil attacker can&apos;t
          share one attestation across ten wallets.
        </p>

        <h2 className="mt-6 text-[28px] font-medium text-[#191A23] md:text-[30px]">
          Try it yourself
        </h2>
        <p className="text-base leading-relaxed text-[#191A23]/80">
          The fastest path to seeing the whole flow end-to-end is the
          repo&apos;s test-signer bridge. Set{" "}
          <span className="font-mono">NEXT_PUBLIC_TEST_PRIVATE_KEY</span> in
          .env.local, start <span className="font-mono">npm run dev</span>,
          and open <span className="font-mono">/dev</span> to generate a
          browser proof with no contract tx. Then head to{" "}
          <span className="font-mono">/create</span>, spin up an auction
          against the live HashKey testnet contracts, and bid against
          yourself from a second tab.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <LinkButton href="/auctions" variant="primary">
            View live auctions
          </LinkButton>
          <LinkButton href="/dev" variant="secondary">
            Proof smoke test
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

function Bullet({
  children,
  dot,
}: {
  children: React.ReactNode;
  dot: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />
      <span>{children}</span>
    </li>
  );
}

function PhaseBlock({
  number,
  title,
  actor,
  what,
  body,
}: {
  number: string;
  title: string;
  actor: string;
  what: string;
  body: string;
}) {
  return (
    <div className="mt-4 rounded-[30px] border border-[#191A23] bg-[#F3F3F3] p-8 md:p-10">
      <div className="mb-5 flex items-center gap-6">
        <span className="text-[48px] font-medium leading-none text-[#191A23] md:text-[60px]">
          {number}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] font-medium leading-[1.1] text-[#191A23] md:text-[26px]">
            {title}
          </h3>
          <span className="font-mono text-sm text-[#191A23]/50">
            {actor} · {what}
          </span>
        </div>
      </div>
      <p className="text-base leading-relaxed text-[#191A23]/80">{body}</p>
    </div>
  );
}

/* ─── Related ──────────────────────────────────────────────────────────── */

const related = [
  {
    category: "Protocol",
    title: "The Noir circuit, line by line",
    href: "https://github.com/IronicDeGawd/Haskkey-SealedHash/tree/main/circuits",
    external: true,
    summary:
      "A walk-through of the range proof circuit and its constraint set.",
  },
  {
    category: "Contracts",
    title: "SealedBidAuction.sol — a 24 KB state machine",
    href: "https://github.com/IronicDeGawd/Haskkey-SealedHash/tree/main/contracts",
    external: true,
    summary:
      "The on-chain settlement contract, how it stays under the EIP-170 cap.",
  },
  {
    category: "Dev",
    title: "Browser proving with @aztec/bb.js",
    href: "/dev",
    external: false,
    summary:
      "Open the dev tools page and generate a proof with no contract tx.",
  },
];

function RelatedCard({
  category,
  title,
  href,
  external,
  summary,
}: {
  category: string;
  title: string;
  href: string;
  external: boolean;
  summary: string;
}) {
  const className =
    "group relative flex flex-col gap-5 rounded-[30px] border border-[#191A23] bg-[#F3F3F3] p-8 shadow-[0_0_0_0_#191A23] transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-white hover:shadow-[0_6px_0_0_#191A23]";
  const inner = (
    <>
      <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-2 py-1 text-sm font-medium text-[#191A23]">
        {category}
      </span>
      <h3 className="text-[20px] font-medium leading-[1.2] text-[#191A23]">
        {title}
      </h3>
      <p className="text-sm text-[#191A23]/60">{summary}</p>
      <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-[#191A23] transition-[gap] duration-300 ease-out group-hover:gap-3">
        Read more
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M9 5l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function RelatedLinks() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-16 md:py-20">
        <div className="mb-10">
          <Pill variant="green">Go deeper</Pill>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {related.map((post) => (
            <RelatedCard key={post.title} {...post} />
          ))}
        </div>
      </div>
    </section>
  );
}
