import { SectionHeading } from "@/components/ui/heading";
import { Address } from "@/components/ui/address";
import { addresses } from "@/lib/addresses";

const EXPLORER = "https://hashkeychain-testnet-explorer.alt.technology/address";

const entries = [
  { label: "SealedBidAuction", addr: addresses.auction, note: "commit · reveal · settle · refund" },
  { label: "HonkVerifier", addr: addresses.verifier, note: "on-chain UltraHonk proof verifier" },
  { label: "KycSBT", addr: addresses.kycSbt, note: "non-transferable level-1 attestation" },
  { label: "mRWA", addr: addresses.mockRwa, note: "mock real-world-asset token" },
  { label: "mUSDT", addr: addresses.mockUsdt, note: "mock escrow currency" },
];

export function LiveOnTestnet() {
  return (
    <section className="border-y border-ink/10 bg-paper">
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <SectionHeading
          label="Live on HashKey Testnet"
          title="Five contracts. One auction loop."
          description="The full deployment is live on HashKey Chain Testnet, chainId 133. Every address below is clickable and verified on the block explorer."
        />
        <div className="mt-12 overflow-hidden rounded-[32px] border border-ink bg-white">
          <table className="w-full">
            <thead className="border-b border-ink/10 bg-ink text-left">
              <tr>
                <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-lime">
                  Contract
                </th>
                <th className="hidden px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-lime md:table-cell">
                  Role
                </th>
                <th className="px-6 py-4 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-lime">
                  Address
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={e.label}
                  className={
                    i !== entries.length - 1 ? "border-b border-ink/10" : ""
                  }
                >
                  <td className="px-6 py-5 font-display text-[16px] font-semibold text-ink">
                    {e.label}
                  </td>
                  <td className="hidden px-6 py-5 text-[13px] text-ink/60 md:table-cell">
                    {e.note}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Address
                      value={e.addr}
                      chars={6}
                      href={`${EXPLORER}/${e.addr}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
