"use client";
// src/context/WalletContext.tsx
// Manages Freighter wallet connection state globally

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

interface WalletContextType {
  address:      string | null;
  isConnecting: boolean;
  connect:      () => Promise<void>;
  disconnect:   () => void;
}

const WalletContext = createContext<WalletContextType>({
  address:      null,
  isConnecting: false,
  connect:      async () => {},
  disconnect:   () => {},
});

const STORAGE_KEY = "hycrows_wallet_connected";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,      setAddress]      = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // ── Auto-reconnect saat halaman dimuat ulang ───────────────────────────────
  useEffect(() => {
    const wasConnected = localStorage.getItem(STORAGE_KEY) === "true";
    if (!wasConnected) return;

    // Coba reconnect di background tanpa menampilkan loading state
    (async () => {
      try {
        const freighter = await import("@stellar/freighter-api");
        const { isConnected } = await freighter.isConnected();
        if (!isConnected) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        const { address: addr } = await freighter.getAddress();
        if (addr) setAddress(addr);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    })();
  }, []);

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const freighter = await import("@stellar/freighter-api");

      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        window.open("https://www.freighter.app/", "_blank");
        throw new Error("Freighter belum terinstall. Install dulu ya!");
      }

      await freighter.setAllowed();

      const { address: addr } = await freighter.getAddress();
      setAddress(addr);
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (err) {
      console.error("Wallet connect error:", err);
      alert(err instanceof Error ? err.message : "Gagal connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
