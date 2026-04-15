import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { WalletButton } from "@/components/WalletButton";

const navLinks = [
  { href: "/auctions", label: "Auctions" },
  { href: "/create", label: "Create" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/dev", label: "Dev" },
];

export function TopNav() {
  return (
    <header className="w-full bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-6 md:px-16 md:py-8">
        <Link href="/" aria-label="SealedHash home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-[#191A23] hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
