import { LinkButton } from "@/components/ui/button";
import { Pill } from "@/components/ui/heading";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1440px] flex-col items-start justify-center gap-8 px-5 py-20 md:px-16 md:py-28">
      <Pill variant="green">404 · sealed</Pill>
      <h1 className="text-[64px] font-medium leading-[1.05] text-[#191A23] md:text-[120px]">
        Not here.
      </h1>
      <p className="max-w-xl text-lg text-[#191A23]/70">
        Whatever you were looking for was not committed on-chain. Head back
        to the auction list or the landing page.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <LinkButton href="/" variant="tertiary">
          Back home
        </LinkButton>
        <LinkButton href="/auctions" variant="secondary">
          View auctions
        </LinkButton>
      </div>
    </div>
  );
}
