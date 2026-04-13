"use client";

import { useWallet } from "@/lib/wallet-context";
import { shortAddress } from "@/lib/format";

/// Yellow banner that appears on every page when the app is running against
/// a local private-key signer instead of an injected wallet. Strictly for
/// dev + Playwright; production builds strip the test signer path.
export function TestSignerBanner() {
  const { isTestSigner, address } = useWallet();
  if (!isTestSigner) return null;
  return (
    <div
      role="alert"
      style={{
        background: "#fff4a3",
        borderBottom: "2px solid #d4a300",
        padding: "6px 12px",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      TEST SIGNER ACTIVE — writes are being signed by a local private key from
      .env.local ({shortAddress(address)}). Never enable this in production.
    </div>
  );
}
