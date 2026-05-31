"use client";
// src/components/WalletButton.tsx

import { useWallet } from "@/context/WalletContext";
import { Wallet, LogOut, Loader2 } from "lucide-react";

export default function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-mono text-emerald-800">{shortAddr}</span>
        </div>
        <button
          onClick={disconnect}
          className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100 transition-colors"
          title="Disconnect"
        >
          <LogOut size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
    >
      {isConnecting ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Wallet size={15} />
      )}
      {isConnecting ? "Connecting…" : "Connect Freighter"}
    </button>
  );
}
