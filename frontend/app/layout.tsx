import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { WalletProvider } from "@/lib/wallet-context";
import { TestSignerBanner } from "@/components/TestSignerBanner";
import { TopNav } from "@/components/chrome/top-nav";
import { Footer } from "@/components/chrome/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SealedHash — Sealed-Bid Auctions on HashKey Chain",
  description:
    "Sealed-bid auctions with on-chain solvency proofs. Commit, prove, reveal, settle — bids stay hidden until the window closes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <WalletProvider>
          <TestSignerBanner />
          <TopNav />
          <main className="w-full flex-1">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
