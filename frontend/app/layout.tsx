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

const SITE_URL = "https://sealedhash.ironyaditya.xyz";
const SITE_NAME = "SealedHash";
const SITE_TAGLINE = "Sealed bids that prove their own solvency";
const SITE_DESCRIPTION =
  "Sealed-bid auctions on HashKey Chain. Bidders commit an encrypted bid, a Noir range proof shows the escrow covers it, and nothing leaks until the reveal window opens. MEV-resistant, KYC-gated, fully on-chain.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "sealed bid auction",
    "zero knowledge",
    "Noir",
    "HashKey Chain",
    "ZK proof",
    "commit reveal",
    "MEV resistant",
    "RWA auction",
    "UltraHonk",
    "DeFi",
  ],
  authors: [{ name: "SealedHash" }],
  creator: "SealedHash",
  publisher: "SealedHash",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
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
