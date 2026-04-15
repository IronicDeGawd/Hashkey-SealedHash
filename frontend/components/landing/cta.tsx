import { LinkButton } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="relative overflow-hidden rounded-[45px] border border-ink bg-ink px-8 py-14 md:px-20 md:py-20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
        <div className="relative grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-[7px] border border-lime/40 bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Run it yourself
            </span>
            <h2 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-white md:text-[56px]">
              Clone the repo. Run the test signer. Bid against yourself.
            </h2>
            <p className="max-w-[50ch] text-[16px] leading-relaxed text-white/70">
              Everything you need is in a single monorepo — Noir circuit,
              Foundry contracts, Next.js frontend, and a dev route that
              generates a proof in the browser.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <LinkButton
                href="https://github.com/IronicDeGawd/Haskkey-SealedHash"
                variant="accent"
                size="lg"
                target="_blank"
                rel="noreferrer"
              >
                GitHub repo
              </LinkButton>
              <LinkButton
                href="/dev"
                variant="outline"
                size="lg"
                className="border-white bg-transparent text-white hover:bg-white hover:text-ink"
              >
                Try proof smoke test
              </LinkButton>
            </div>
          </div>
          <div className="grid gap-3 font-mono text-[13px] text-white/70">
            <TerminalLine prompt="$" text="git clone IronicDeGawd/Haskkey-SealedHash" />
            <TerminalLine prompt="$" text="cd frontend && npm install" />
            <TerminalLine prompt="$" text="NEXT_PUBLIC_TEST_PRIVATE_KEY=0x… npm run dev" />
            <TerminalLine prompt="→" text="open http://localhost:3000/dev" accent />
          </div>
        </div>
      </div>
    </section>
  );
}

function TerminalLine({
  prompt,
  text,
  accent,
}: {
  prompt: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-[10px] border border-white/15 bg-white/5 px-4 py-3">
      <span className={accent ? "text-lime" : "text-white/40"}>{prompt}</span>
      <span className={accent ? "text-lime" : "text-white"}>{text}</span>
    </div>
  );
}
