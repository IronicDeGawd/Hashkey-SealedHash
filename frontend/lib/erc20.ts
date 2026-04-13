import type { Abi, Address, Hex } from "viem";
import { publicClient, getWalletClient } from "./chain";
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

// ---- writes --------------------------------------------------------------

export async function approve(token: Address, spender: Address, amount: bigint): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: token,
    abi: ABI,
    functionName: "approve",
    args: [spender, amount],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/// Only valid against MockERC20 (public mint). Real ERC20s will revert.
export async function mint(token: Address, to: Address, amount: bigint): Promise<Hex> {
  const wallet = await getWalletClient();
  const { request } = await publicClient.simulateContract({
    account: wallet.account!,
    address: token,
    abi: ABI,
    functionName: "mint",
    args: [to, amount],
  });
  const hash = await wallet.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
