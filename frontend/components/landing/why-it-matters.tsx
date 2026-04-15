import { SectionHeading } from "@/components/ui/heading";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const columns = [
  {
    tone: "paper" as const,
    tag: "open auctions",
    title: "Bids are public the moment they land.",
    body: "Competitors watch the mempool, snipe the top bid by a gas-priced wei, and walk away. Honest bidders get front-run out of the market.",
  },
  {
    tone: "white" as const,
    tag: "commit-reveal alone",
    title: "Hiding works, solvency doesn’t.",
    body: "Commit-reveal hides the amount but not the ability to pay. Losers can grief auctions by committing to bids they cannot back when the reveal window opens.",
  },
  {
    tone: "lime" as const,
    tag: "SealedHash",
    title: "Prove solvency without revealing the bid.",
    body: "A Noir range proof verifies that min_bid ≤ amount ≤ escrowed USDT before the commit lands. The chain knows you can pay. It does not know how much.",
  },
];

export function WhyItMatters() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <SectionHeading
        label="Why it matters"
        title="Sealed bids need sealed solvency."
        description="Three ways to run an auction on-chain, three very different failure modes."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-7">
        {columns.map((c, i) => (
          <Card key={c.tag} variant={c.tone} hover>
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-center justify-between">
                <Pill tone={c.tone === "lime" ? "ink" : "lime"}>{c.tag}</Pill>
                <span className="font-mono text-[12px] text-current/50">
                  0{i + 1}
                </span>
              </div>
              <CardTitle>{c.title}</CardTitle>
              <CardBody>{c.body}</CardBody>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
