import { addresses } from "@/lib/addresses";
import { truncateAddress } from "@/lib/truncate";

const EXPLORER = "https://hashkeychain-testnet-explorer.alt.technology/address";

const entries = [
  {
    label: "SealedBidAuction",
    addr: addresses.auction,
    body: "Commit, reveal, settle, refund. The entire auction lifecycle lives in a single 24 KB contract, well under the EIP-170 cap.",
  },
  {
    label: "HonkVerifier",
    addr: addresses.verifier,
    body: "On-chain UltraHonk proof verifier — generated directly from the Noir circuit. Every commit tx ships a fresh range proof.",
  },
  {
    label: "KycSBT",
    addr: addresses.kycSbt,
    body: "Non-transferable level-1 identity attestation. Gates both auction creation and bidding. No level, no bid.",
  },
];

export function LiveOnTestnet() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-16">
      <div className="mb-14 flex items-start gap-10">
        <div className="flex flex-col gap-5">
          <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-[7px] py-[5px] text-xl font-medium text-[#191A23]">
            Live on HashKey Testnet
          </span>
          <h2 className="text-[32px] font-medium leading-[1.2] text-[#191A23] md:text-[40px]">
            Three contracts. One auction loop. Zero trusted parties.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-[45px] bg-[#191A23] md:grid-cols-3 md:divide-x md:divide-white/10">
        {entries.map((e) => (
          <div
            key={e.label}
            className="flex flex-col gap-6 p-10 md:gap-8 md:p-12"
          >
            <span className="inline-block w-fit rounded-[7px] bg-[#B9FF66] px-[7px] py-[5px] text-sm font-medium text-[#191A23]">
              {e.label}
            </span>
            <p className="text-base leading-relaxed text-white">{e.body}</p>
            <a
              href={`${EXPLORER}/${e.addr}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-base font-medium text-[#B9FF66] hover:opacity-80"
            >
              <span className="font-mono text-sm">
                {truncateAddress(e.addr, 6)}
              </span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 10h14M13 6l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        ))}
      </div>

      {/* Secondary contracts */}
      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-[14px] bg-[#F3F3F3] px-6 py-5">
        <span className="text-sm font-medium text-[#191A23]">
          Also deployed:
        </span>
        <a
          href={`${EXPLORER}/${addresses.mockRwa}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-[10px] border border-[#191A23]/20 bg-white px-3 py-1.5 text-sm hover:border-[#191A23]"
        >
          mRWA
          <span className="font-mono text-xs text-[#191A23]/60">
            {truncateAddress(addresses.mockRwa, 4)}
          </span>
        </a>
        <a
          href={`${EXPLORER}/${addresses.mockUsdt}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-[10px] border border-[#191A23]/20 bg-white px-3 py-1.5 text-sm hover:border-[#191A23]"
        >
          mUSDT
          <span className="font-mono text-xs text-[#191A23]/60">
            {truncateAddress(addresses.mockUsdt, 4)}
          </span>
        </a>
        <span className="text-sm text-[#191A23]/60">chainId 133</span>
      </div>
    </section>
  );
}
