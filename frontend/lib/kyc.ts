import type { Abi, Address, Hex } from "viem";
import { publicClient, getWalletClient } from "./chain";
import { addresses } from "./addresses";
import { kycSbtAbi } from "./abis";

const ABI = kycSbtAbi as Abi;

export type KycInfo = {
  isValid: boolean;
  level: number;
};

export async function readIsHuman(account: Address): Promise<KycInfo> {
  const raw = (await publicClient.readContract({
    address: addresses.kycSbt,
    abi: ABI,
    functionName: "isHuman",
    args: [account],
  })) as readonly [boolean, number];
  return { isValid: raw[0], level: raw[1] };
}

// ---- writes --------------------------------------------------------------

/// Self-KYC in the mock SBT. Only works because MockKycSBT has no access
/// control on setHuman - the real HashKey KYC SBT is owner-gated. Shown in
/// the pitch as "demo-only shortcut" vs "production calls hunyuankyc.com".
export async function selfKycMock(account: Address, level: number): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: addresses.kycSbt,
    abi: ABI,
    functionName: "setHuman",
    args: [account, true, level],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
