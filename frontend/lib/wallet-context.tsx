"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Address, Hex } from "viem";
import { toHex } from "viem";
import {
  hashkeyTestnet,
  readCurrentAccount,
  requestAccount,
  hasInjectedWallet,
  isTestSignerEnabled,
  publicClient,
  getWalletClient,
} from "./chain";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (payload: unknown) => void) => void;
  removeListener?: (event: string, handler: (payload: unknown) => void) => void;
};

type WalletState = {
  address: Address | null;
  chainId: number | null;
  status: "idle" | "connecting" | "connected" | "error";
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isRightChain: boolean;
  hasWallet: boolean;
  isTestSigner: boolean;
  isContractWallet: boolean;
  signMessage: (message: string) => Promise<Hex>;
};

const WalletContext = createContext<WalletState | null>(null);

function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { ethereum?: EthereumProvider }).ethereum) ?? null;
}

async function readChainId(): Promise<number | null> {
  const provider = getProvider();
  if (!provider) return null;
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [status, setStatus] = useState<WalletState["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [isTestSigner, setIsTestSigner] = useState(false);
  const [isContractWallet, setIsContractWallet] = useState(false);

  // On mount: detect wallet, passively read account + chain if already authorized.
  // If test signer is enabled (dev-only env flag, no injected wallet), wire it
  // into the same state slots so the rest of the app is agnostic.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const testMode = isTestSignerEnabled();
      if (!cancelled) setIsTestSigner(testMode);
      const present = testMode || hasInjectedWallet();
      if (!cancelled) setHasWallet(present);
      if (!present) return;
      try {
        // Test signer: auto-connect because there's no UI to click.
        const existing = testMode ? await requestAccount() : await readCurrentAccount();
        const chain = testMode ? hashkeyTestnet.id : await readChainId();
        if (cancelled) return;
        if (existing) {
          setAddress(existing);
          setStatus("connected");
        }
        setChainId(chain);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to wallet events so the UI reacts when the user flips accounts
  // or chains from inside MetaMask/OKX. Some wallets only emit chainChanged to
  // authorized sites, so we also re-read chainId on focus/visibility as a
  // safety net for users who switch chains in MetaMask mid-session.
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const onAccounts = (payload: unknown) => {
      const accounts = payload as string[];
      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setStatus("idle");
      } else {
        setAddress(accounts[0] as Address);
        setStatus("connected");
      }
    };
    const onChain = (payload: unknown) => {
      const hex = payload as string;
      setChainId(Number.parseInt(hex, 16));
    };
    const recheckChain = () => {
      readChainId().then((id) => {
        if (id !== null) setChainId(id);
      }).catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") recheckChain();
    };

    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    window.addEventListener("focus", recheckChain);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
      window.removeEventListener("focus", recheckChain);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Refetch chainId whenever the connected address changes. Covers the case
  // where a user opens the site on the wrong chain, switches in MetaMask,
  // then clicks connect — eth_chainId at that moment is authoritative.
  useEffect(() => {
    if (!address || isTestSigner) return;
    readChainId().then((id) => {
      if (id !== null) setChainId(id);
    }).catch(() => {});
  }, [address, isTestSigner]);

  // Detect smart-contract wallet (Safe, ERC-4337) by reading bytecode at the
  // signer address. Phase 3 nonce-backup encryption derives its key from a
  // wallet signature; that derivation is only deterministic for EOAs (RFC 6979)
  // so contract wallets must be gated out of the backup flow until a passkey-
  // PRF or recovery-phrase fallback is added.
  useEffect(() => {
    let cancelled = false;
    if (!address) {
      setIsContractWallet(false);
      return;
    }
    publicClient
      .getCode({ address })
      .then((code) => {
        if (cancelled) return;
        setIsContractWallet(code !== undefined && code !== "0x" && code.length > 2);
      })
      .catch(() => {
        if (cancelled) return;
        setIsContractWallet(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  // SIWE auth and the nonce-backup key derivation both need a raw personal_sign
  // over a fixed string. Test-signer path goes through viem's walletClient so
  // Playwright e2e works; the injected-wallet path calls personal_sign directly
  // with the message hex-encoded per EIP-191.
  const signMessage = useCallback(
    async (message: string): Promise<Hex> => {
      if (!address) throw new Error("Wallet not connected.");
      if (isTestSigner) {
        const wc = await getWalletClient();
        return wc.signMessage({ account: wc.account!, message });
      }
      const provider = getProvider();
      if (!provider) throw new Error("No injected wallet.");
      const sig = (await provider.request({
        method: "personal_sign",
        params: [toHex(message), address],
      })) as Hex;
      return sig;
    },
    [address, isTestSigner],
  );

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const addr = await requestAccount();
      setAddress(addr);
      const chain = await readChainId();
      setChainId(chain);
      setStatus("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    // EIP-1193 has no standard "disconnect" - forget the address locally.
    setAddress(null);
    setStatus("idle");
    setError(null);
  }, []);

  const isRightChain = chainId === hashkeyTestnet.id;

  const value = useMemo<WalletState>(
    () => ({
      address,
      chainId,
      status,
      error,
      connect,
      disconnect,
      isRightChain,
      hasWallet,
      isTestSigner,
      isContractWallet,
      signMessage,
    }),
    [
      address,
      chainId,
      status,
      error,
      connect,
      disconnect,
      isRightChain,
      hasWallet,
      isTestSigner,
      isContractWallet,
      signMessage,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
