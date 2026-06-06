"use client";
// src/components/WalletButton.tsx

import { useWallet } from "@/context/WalletContext";
import { Wallet, LogOut, Loader2, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { EXPLORER_BASE_URL } from "@/lib/stellar";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

export default function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
      setIsOpen(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
    toast("Wallet disconnected", { icon: "👋" });
  };

  if (address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-sm font-mono font-bold text-emerald-800">{shortAddr}</span>
          <ChevronDown size={14} className={`text-emerald-700 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Connected Wallet</p>
            </div>
            <div className="p-1.5 flex flex-col">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors w-full text-left"
              >
                <Copy size={14} className="text-slate-400" />
                Copy Address
              </button>
              <a
                href={`${EXPLORER_BASE_URL}/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors w-full text-left"
              >
                <ExternalLink size={14} className="text-slate-400" />
                View Explorer
              </a>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors w-full text-left"
              >
                <LogOut size={14} className="text-red-400" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-slate-900/10"
    >
      {isConnecting ? (
        <Loader2 size={15} className="animate-spin text-violet-300" />
      ) : (
        <Wallet size={15} className="text-violet-300" />
      )}
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
