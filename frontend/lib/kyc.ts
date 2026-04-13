import type { Abi, Address } from "viem";
import { publicClient } from "./chain";
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
