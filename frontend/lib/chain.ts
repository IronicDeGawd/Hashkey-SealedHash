import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";

// HashKey Chain testnet is not in viem's built-in chain list.
// Values are from the HashKey Developer Reference Guide section 2.
export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    name: "HashKey Token",
    symbol: "HSK",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet.hsk.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "HashKey Testnet Explorer",
      url: "https://testnet-explorer.hsk.xyz",
    },
  },
  testnet: true,
});

const rpcUrl = process.env.NEXT_PUBLIC_HASHKEY_RPC_URL ?? "https://testnet.hsk.xyz";

export const publicClient: PublicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(rpcUrl),
});

// Guard around window.ethereum so SSR/build does not choke on undefined.
type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

export function hasInjectedWallet(): boolean {
  return getInjectedProvider() !== null;
}

/// Request the connected address from the injected wallet, prompting the
/// user if they have not connected this site yet. Throws if no wallet.
export async function requestAccount(): Promise<`0x${string}`> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet. Install MetaMask or OKX and reload.");
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) throw new Error("Wallet returned no accounts.");
  return accounts[0] as `0x${string}`;
}

/// Read the currently-connected address without prompting. Returns null if
/// the user has not connected yet.
export async function readCurrentAccount(): Promise<`0x${string}` | null> {
  const provider = getInjectedProvider();
  if (!provider) return null;
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
  if (!accounts || accounts.length === 0) return null;
  return accounts[0] as `0x${string}`;
}

/// Ask the wallet to switch to HashKey testnet. If the wallet does not yet
/// know the chain, add it first. Called before every write transaction so a
/// wallet on Ethereum mainnet cannot accidentally broadcast to the wrong net.
export async function ensureHashkeyTestnet(): Promise<void> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet.");
  const hexId = `0x${hashkeyTestnet.id.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    // 4902 means the chain is not yet added to the wallet.
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexId,
            chainName: hashkeyTestnet.name,
            nativeCurrency: hashkeyTestnet.nativeCurrency,
            rpcUrls: hashkeyTestnet.rpcUrls.default.http,
            blockExplorerUrls: [hashkeyTestnet.blockExplorers.default.url],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

/// Return a viem WalletClient bound to the injected provider. Call right
/// before a write; do not cache across sessions because the user can switch
/// accounts in the wallet UI at any time.
export async function getWalletClient(): Promise<WalletClient> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet.");
  await ensureHashkeyTestnet();
  const account = await requestAccount();
  return createWalletClient({
    account,
    chain: hashkeyTestnet,
    transport: custom(provider as never),
  });
}
