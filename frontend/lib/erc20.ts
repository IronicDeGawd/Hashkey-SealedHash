import type { Abi, Address } from "viem";
import { publicClient } from "./chain";
import { erc20Abi } from "./abis";

const ABI = erc20Abi as Abi;

export type Erc20Metadata = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
};

export async function readErc20Metadata(token: Address): Promise<Erc20Metadata> {
  const [name, symbol, decimals] = await Promise.all([
    publicClient.readContract({ address: token, abi: ABI, functionName: "name" }) as Promise<string>,
    publicClient.readContract({ address: token, abi: ABI, functionName: "symbol" }) as Promise<string>,
    publicClient.readContract({ address: token, abi: ABI, functionName: "decimals" }) as Promise<number>,
  ]);
  return { address: token, name, symbol, decimals };
}

export async function readBalance(token: Address, owner: Address): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: ABI,
    functionName: "balanceOf",
    args: [owner],
  })) as bigint;
}

export async function readAllowance(
  token: Address,
  owner: Address,
  spender: Address,
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: ABI,
    functionName: "allowance",
    args: [owner, spender],
  })) as bigint;
}
