import { Button, LinkButton } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-10 px-5 pb-16 pt-6 md:flex-row md:gap-8 md:px-16 md:pb-20 md:pt-10">
        {/* Left */}
        <div className="flex flex-1 flex-col gap-8">
          <h1 className="text-[44px] font-medium leading-[1.05] text-[#191A23] md:text-[60px] md:leading-[1.1]">
            Sealed bids that prove their own solvency.
          </h1>
          <p className="max-w-[520px] text-lg text-[#191A23]/80">
            SealedHash runs sealed-bid auctions on HashKey Chain. Bidders
            commit an encrypted amount, a Noir range proof convinces the
            chain their escrow covers the bid, and nothing leaks until the
            reveal window opens.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <LinkButton href="/auctions" variant="primary">
              View live auctions
            </LinkButton>
            <LinkButton href="#how-it-works" variant="secondary">
              How it works
            </LinkButton>
          </div>
        </div>

        {/* Right — flat illustration */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-[380px] w-full max-w-[600px] md:h-[515px]">
            <svg
              viewBox="0 0 600 515"
              fill="none"
              className="h-full w-full"
              aria-label="Commit prove reveal diagram"
            >
              {/* Background circle */}
              <ellipse
                cx="300"
                cy="260"
                rx="200"
                ry="170"
                stroke="#191A23"
                strokeWidth="3"
                strokeDasharray="8 6"
              />

              {/* COMMIT card */}
              <g>
                <rect
                  x="60"
                  y="80"
                  width="200"
                  height="110"
                  rx="18"
                  fill="#F3F3F3"
                  stroke="#191A23"
                  strokeWidth="2.5"
                />
                <rect
                  x="80"
                  y="100"
                  width="70"
                  height="20"
                  rx="6"
                  fill="#B9FF66"
                />
                <text
                  x="115"
                  y="115"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                  fill="#191A23"
                >
                  01 · COMMIT
                </text>
                <rect
                  x="80"
                  y="135"
                  width="160"
                  height="8"
                  rx="3"
                  fill="#191A23"
                  opacity="0.3"
                />
                <rect
                  x="80"
                  y="150"
                  width="120"
                  height="8"
                  rx="3"
                  fill="#191A23"
                  opacity="0.2"
                />
                <rect
                  x="80"
                  y="165"
                  width="100"
                  height="8"
                  rx="3"
                  fill="#191A23"
                  opacity="0.2"
                />
              </g>

              {/* PROVE card — lime */}
              <g>
                <rect
                  x="340"
                  y="80"
                  width="200"
                  height="110"
                  rx="18"
                  fill="#B9FF66"
                  stroke="#191A23"
                  strokeWidth="2.5"
                />
                <rect
                  x="360"
                  y="100"
                  width="90"
                  height="20"
                  rx="6"
                  fill="white"
                  stroke="#191A23"
                  strokeWidth="1.2"
                />
                <text
                  x="405"
                  y="115"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                  fill="#191A23"
                >
                  02 · PROVE
                </text>
                <text
                  x="360"
                  y="148"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="#191A23"
                >
                  noir range proof
                </text>
                <text
                  x="360"
                  y="165"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="#191A23"
                >
                  min ≤ bid ≤ escrow
                </text>
              </g>

              {/* Arrow commit → prove */}
              <path
                d="M260 135 L340 135"
                stroke="#191A23"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M332 128 L342 135 L332 142"
                stroke="#191A23"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Sealed ledger block — ink */}
              <g>
                <rect
                  x="110"
                  y="230"
                  width="380"
                  height="115"
                  rx="20"
                  fill="#191A23"
                />
                <rect
                  x="130"
                  y="250"
                  width="120"
                  height="22"
                  rx="6"
                  fill="#B9FF66"
                />
                <text
                  x="190"
                  y="266"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                  fill="#191A23"
                >
                  SEALED STATE
                </text>
                <text
                  x="130"
                  y="295"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="white"
                >
                  commitHash: 0x4f…92a
                </text>
                <text
                  x="130"
                  y="312"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="white"
                >
                  escrow: 1200 mUSDT
                </text>
                <text
                  x="130"
                  y="329"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="white"
                >
                  bid: ???
                </text>
              </g>

              {/* Arrow to reveal */}
              <path
                d="M300 352 L300 390"
                stroke="#191A23"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M293 383 L300 393 L307 383"
                stroke="#191A23"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Reveal card */}
              <g>
                <rect
                  x="60"
                  y="400"
                  width="480"
                  height="90"
                  rx="18"
                  fill="white"
                  stroke="#191A23"
                  strokeWidth="2.5"
                />
                <rect
                  x="80"
                  y="418"
                  width="90"
                  height="22"
                  rx="6"
                  fill="#B9FF66"
                />
                <text
                  x="125"
                  y="434"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                  fill="#191A23"
                >
                  03 · REVEAL
                </text>
                <text
                  x="80"
                  y="462"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="#191A23"
                >
                  window opens · bidder reveals (amount, nonce)
                </text>
                <text
                  x="80"
                  y="478"
                  fontFamily="monospace"
                  fontSize="11"
                  fill="#191A23"
                  opacity="0.65"
                >
                  highest wins · losers refund · winner takes the asset
                </text>
              </g>

              {/* Accent stars */}
              <path
                d="M540 50 l6 18 18 6-18 6-6 18-6-18-18-6 18-6Z"
                fill="#191A23"
              />
              <path
                d="M30 430 l4 12 12 4-12 4-4 12-4-12-12-4 12-4Z"
                fill="#B9FF66"
                stroke="#191A23"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tech strip */}
      <div className="border-y border-[#191A23] py-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 md:px-16">
          {[
            "HashKey Chain",
            "Noir",
            "UltraHonk",
            "Foundry",
            "Viem",
            "Next.js",
          ].map((brand) => (
            <span
              key={brand}
              className="text-xl font-semibold text-[#191A23] opacity-80"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
