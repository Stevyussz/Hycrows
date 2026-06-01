"use client";
// src/app/page.tsx — HyCrows Dashboard Homepage

import WalletButton from "@/components/WalletButton";
import DepositForm from "@/components/DepositForm";
import LookupPanel from "@/components/LookupPanel";
import { useWallet } from "@/context/WalletContext";
import { CONTRACT_ID, ADMIN_ADDRESS } from "@/lib/stellar";
import {
  Shield, Zap, Scale, ExternalLink, Copy, CheckCircle,
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"lookup" | "about">("lookup");
  const [activeTxnId, setActiveTxnId] = useState("");

  function copyContract() {
    navigator.clipboard.writeText(CONTRACT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-500/30">
              H
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight">HyCrows</span>
              <span className="ml-2 text-xs text-violet-400 font-medium bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                Testnet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://lab.stellar.org/r/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors"
            >
              <ExternalLink size={13} />
              Stellar Lab
            </a>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          {/* Glow orb */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl animate-glow" />
            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-emerald-500 flex items-center justify-center text-4xl shadow-2xl shadow-violet-500/40 animate-float">
              🦅
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
            HyCrows{" "}
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Escrow
            </span>
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-base sm:text-lg">
            A trustless escrow protocol on Stellar Soroban. Featuring anti-griefing staking, 
            automated time-locks, and on-chain dispute resolution.
          </p>

          {/* Contract ID */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <span className="text-xs text-slate-500 font-medium">Contract:</span>
            <span className="font-mono text-xs text-slate-700">
              {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-6)}
            </span>
            <button
              onClick={copyContract}
              className="text-slate-400 hover:text-violet-600 transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* ── Feature Cards ───────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: <Shield className="text-violet-500" size={22} />,
              title: "Anti-Griefing Stake",
              desc: "A 2 XLM stake is required to open a dispute, preventing spam and protecting sellers.",
              color: "bg-white",
              border: "border-slate-200",
            },
            {
              icon: <Zap className="text-emerald-500" size={22} />,
              title: "24-Hour Auto-Release",
              desc: "Funds automatically release to the seller 24 hours after shipment if the buyer is unresponsive.",
              color: "bg-white",
              border: "border-slate-200",
            },
            {
              icon: <Scale className="text-amber-500" size={22} />,
              title: "On-Chain Resolution",
              desc: "All administrative decisions are permanently recorded on the blockchain. Transparent and immutable.",
              color: "bg-white",
              border: "border-slate-200",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`bg-white/60 backdrop-blur-sm border ${f.border} shadow-sm rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all duration-300`}
            >
              <div className="mb-4 bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100">{f.icon}</div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">{f.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Main Panel ──────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">1</span>
                Connect Wallet
              </h2>
              {!address ? (
                <div className="text-center py-5">
                  <p className="text-sm text-slate-600 mb-5">
                    Connect your Freighter Wallet to start transacting securely.
                  </p>
                  <div className="flex justify-center"><WalletButton /></div>
                  <p className="text-xs text-slate-500 mt-4">
                    Don't have one?{" "}
                    <a
                      href="https://www.freighter.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 font-medium hover:underline"
                    >
                      Install Freighter
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">Connected as</p>
                    <p className="font-mono text-xs text-emerald-700 break-all bg-emerald-50 p-2 rounded border border-emerald-100">{address}</p>
                    {address === ADMIN_ADDRESS && (
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
                        👑 Treasury Admin
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Create Escrow */}
            {address && (
              <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6">
                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">2</span>
                  Create Escrow
                </h2>
                <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                  Lock XLM as a buyer. Your funds are safely held in the smart contract until the seller delivers and you confirm receipt.
                </p>
                <DepositForm onSuccess={(txnId) => {
                  setActiveTxnId(txnId);
                  setTab("lookup");
                }} />
              </div>
            )}

            {/* Network Info */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Network Configuration</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: "Network", value: "Stellar Testnet" },
                  { label: "Protocol", value: "Version 26" },
                  { label: "SDK", value: "soroban-sdk v26" },
                  { label: "Dispute Stake", value: "2 XLM" },
                  { label: "Auto-Release", value: "24 Hours" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-slate-500 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <span>{label}</span>
                    <span className="text-slate-700 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Lookup */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6 min-h-full">
              <div className="flex items-center gap-4 mb-6 border-b border-slate-100">
                <button
                  onClick={() => setTab("lookup")}
                  className={`text-sm font-semibold pb-3 px-1 border-b-2 transition-colors ${
                    tab === "lookup"
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Find Transaction
                </button>
                <button
                  onClick={() => setTab("about")}
                  className={`text-sm font-semibold pb-3 px-1 border-b-2 transition-colors ${
                    tab === "about"
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Protocol Flow
                </button>
              </div>
              {tab === "lookup" && <LookupPanel autoFetchId={activeTxnId} />}

              {tab === "about" && (
                <div className="space-y-4">
                  {(() => {
                    const stepColors: Record<string, { badge: string; dot: string }> = {
                      violet: { badge: "bg-violet-100 text-violet-600 border-violet-200", dot: "bg-violet-500" },
                      blue:   { badge: "bg-blue-100 text-blue-600 border-blue-200",       dot: "bg-blue-500" },
                      emerald:{ badge: "bg-emerald-100 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
                      amber:  { badge: "bg-amber-100 text-amber-600 border-amber-200",    dot: "bg-amber-500" },
                      red:    { badge: "bg-red-100 text-red-600 border-red-200",          dot: "bg-red-500" },
                      purple: { badge: "bg-purple-100 text-purple-600 border-purple-200", dot: "bg-purple-500" },
                    };
                    return [
                      {
                        step: "1", actor: "Buyer", color: "violet",
                        title: "Deposit into Escrow",
                        desc: 'Buyer locks XLM into the smart contract. Status becomes "Pending". Funds are safely held on-chain.',
                      },
                      {
                        step: "2", actor: "Seller", color: "blue",
                        title: "Mark as Shipped",
                        desc: 'Seller delivers the goods/services and marks them as shipped. Status becomes "Shipped". A 24-hour countdown begins.',
                      },
                      {
                        step: "3A", actor: "Buyer", color: "emerald",
                        title: "Confirm Receipt",
                        desc: 'Happy path! The buyer confirms receipt, instantly releasing funds to the seller. Status becomes "Resolved".',
                      },
                      {
                        step: "3B", actor: "Anyone", color: "amber",
                        title: "Automated Release",
                        desc: "If the buyer is unresponsive for 24 hours after shipment, anyone can trigger the auto-release to pay the seller.",
                      },
                      {
                        step: "3C", actor: "Buyer", color: "red",
                        title: "Open Dispute (+2 XLM Stake)",
                        desc: "Unsatisfied? The buyer can open a dispute by staking a 2 XLM anti-griefing fee. Both parties discuss via the Chat Room.",
                      },
                      {
                        step: "4", actor: "Admin", color: "purple",
                        title: "Resolve Dispute",
                        desc: "The Treasury Admin reviews the Chat Room evidence. If the buyer wins, they get a full refund + stake back. If the seller wins, the seller gets paid and the stake is slashed.",
                      },
                    ].map((s) => (
                      <div key={s.step} className="flex gap-5 p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all shadow-sm">
                        <div className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center font-bold text-base ${stepColors[s.color]?.badge ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {s.step}
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">{s.actor}</p>
                          <p className="font-bold text-slate-900 text-sm mb-1.5">{s.title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <p>HyCrows Escrow Protocol • Stellar Testnet • Contract: <span className="font-mono text-slate-500">{CONTRACT_ID}</span></p>
        <p className="mt-1">
          <a href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline font-medium">
            View on Stellar Expert
          </a>
        </p>
      </footer>
    </div>
  );
}
