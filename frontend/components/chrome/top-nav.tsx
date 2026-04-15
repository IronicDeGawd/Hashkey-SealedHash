import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { WalletButton } from "@/components/WalletButton";

const links = [
  { href: "/auctions", label: "Auctions" },
  { href: "/create", label: "Create" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/dev", label: "Dev" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-4 md:px-10 md:py-5">
        <Link
          href="/"
          aria-label="SealedHash home"
          className="rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-display text-[15px] text-ink/80 transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
