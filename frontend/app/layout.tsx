import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
