import { LinkButton } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[900px] flex-col items-start justify-center gap-8 px-5 py-20 md:px-10">
      <Pill tone="lime">404 · sealed</Pill>
      <h1 className="font-display text-[64px] font-semibold leading-none tracking-tight text-ink md:text-[120px]">
        Not here.
      </h1>
      <p className="max-w-xl text-[17px] leading-relaxed text-ink/70">
        Whatever you were looking for was not committed on-chain. Head back to
        the auction list or the landing page.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href="/" variant="accent" size="lg">
          Back home
        </LinkButton>
        <LinkButton href="/auctions" variant="outline" size="lg">
          View auctions
        </LinkButton>
      </div>
    </div>
  );
}
