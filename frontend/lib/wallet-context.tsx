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
import type { Address } from "viem";
import { hashkeyTestnet, readCurrentAccount, requestAccount, hasInjectedWallet } from "./chain";

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

  // On mount: detect wallet, passively read account + chain if already authorized.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const present = hasInjectedWallet();
      if (!cancelled) setHasWallet(present);
      if (!present) return;
      try {
        const existing = await readCurrentAccount();
        const chain = await readChainId();
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
  // or chains from inside MetaMask/OKX.
  useEffect(() => {
    const provider = getProvider();
    if (!provider?.on || !provider.removeListener) return;

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

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener!("accountsChanged", onAccounts);
      provider.removeListener!("chainChanged", onChain);
    };
  }, []);

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
    () => ({ address, chainId, status, error, connect, disconnect, isRightChain, hasWallet }),
    [address, chainId, status, error, connect, disconnect, isRightChain, hasWallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
