import type { Address } from "viem";

// Live HashKey testnet deploys as of 2026-04-14. Defaults are the canonical
// addresses so the demo runs out of the box; override any of these via
// NEXT_PUBLIC_* env vars if a redeploy shifts them.
export const addresses: {
  verifier: Address;
  kycSbt: Address;
  auction: Address;
  mockRwa: Address;
  mockUsdt: Address;
} = {
  verifier: (process.env.NEXT_PUBLIC_VERIFIER_ADDRESS ??
    "0x9E0830b0D6f180e2Eaf8E14956386383d855cEd7") as Address,
  kycSbt: (process.env.NEXT_PUBLIC_KYC_SBT_ADDRESS ??
    "0x53e1F063166AbFbc7C387839BA439b1bb974E319") as Address,
  auction: (process.env.NEXT_PUBLIC_AUCTION_ADDRESS ??
    "0x15dd37d92eD9526300FE5de5aB555AeA6C621f22") as Address,
  mockRwa: (process.env.NEXT_PUBLIC_MOCK_RWA_ADDRESS ??
    "0x6d4b1af928CBE669659521B5DEA37961B37ACCe9") as Address,
  mockUsdt: (process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS ??
    "0xAfc441e6baf4518f38159AecBd0Eed6EDd083198") as Address,
};

// Minimum KYC level the deployed auction enforces. Matches the constructor
// arg used by script/Deploy.s.sol. 1 = BASIC.
export const MIN_KYC_LEVEL = 1;
