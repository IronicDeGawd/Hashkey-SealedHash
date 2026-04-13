import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

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

// --- Test signer bridge ---------------------------------------------------
// Enabled only when NEXT_PUBLIC_TEST_PRIVATE_KEY is set AND NODE_ENV is not
// production AND no injected wallet is present. Used by Playwright so the
// headless browser can sign txs end-to-end. Real deployments strip this path
// at build time because the env var must be absent in production .env.
function readTestKey(): `0x${string}` | null {
  if (process.env.NODE_ENV === "production") return null;
  const key = process.env.NEXT_PUBLIC_TEST_PRIVATE_KEY;
  if (!key || !key.startsWith("0x")) return null;
  return key as `0x${string}`;
}

export function isTestSignerEnabled(): boolean {
  if (readTestKey() === null) return false;
  if (typeof window === "undefined") return false; // only in the browser
  return !hasInjectedWallet();
}

export function getTestSignerAddress(): Address | null {
  const key = readTestKey();
  if (!key) return null;
  return privateKeyToAccount(key).address;
}

/// Request the connected address from the injected wallet, prompting the
/// user if they have not connected this site yet. Throws if no wallet.
export async function requestAccount(): Promise<`0x${string}`> {
  if (isTestSignerEnabled()) {
    const addr = getTestSignerAddress();
    if (!addr) throw new Error("Test signer enabled but key missing.");
    return addr;
  }
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet. Install MetaMask or OKX and reload.");
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) throw new Error("Wallet returned no accounts.");
  return accounts[0] as `0x${string}`;
}

/// Read the currently-connected address without prompting. Returns null if
/// the user has not connected yet.
export async function readCurrentAccount(): Promise<`0x${string}` | null> {
  if (isTestSignerEnabled()) return getTestSignerAddress();
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
  if (isTestSignerEnabled()) return; // test signer is always on the right chain
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

/// Return a viem WalletClient bound to the injected provider, OR - when the
/// test signer is active - a local-key WalletClient using the same http
/// transport as the publicClient. Call right before a write; do not cache
/// across sessions because the user can switch accounts in the wallet UI at
/// any time.
export async function getWalletClient(): Promise<WalletClient> {
  const testKey = readTestKey();
  if (testKey && !hasInjectedWallet() && typeof window !== "undefined") {
    const account = privateKeyToAccount(testKey);
    return createWalletClient({
      account,
      chain: hashkeyTestnet,
      transport: http(rpcUrl),
    });
  }
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
