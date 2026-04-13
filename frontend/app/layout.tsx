import type { Metadata } from "next";
import { WalletProvider } from "@/lib/wallet-context";
import { TestSignerBanner } from "@/components/TestSignerBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sealed-Bid Auction",
  description: "Private sealed-bid auction on HashKey Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <TestSignerBanner />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
