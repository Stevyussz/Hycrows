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
            Trustless escrow protocol di Stellar Soroban. Anti-griefing staking,
            auto-release otomatis, resolusi sengketa on-chain.
          </p>

          {/* Contract ID */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500">Contract:</span>
            <span className="font-mono text-xs text-slate-700">
              {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-6)}
            </span>
            <button
              onClick={copyContract}
              className="text-slate-400 hover:text-violet-600 transition-colors"
            >
              {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* ── Feature Cards ───────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: <Shield className="text-violet-400" size={20} />,
              title: "Anti-Griefing Stake",
              desc: "2 XLM stake wajib saat buka dispute. Mencegah spam & melindungi seller.",
              color: "bg-white",
              border: "border-slate-200",
            },
            {
              icon: <Zap className="text-emerald-400" size={20} />,
              title: "Auto-Release 24 Jam",
              desc: "Dana otomatis ke seller 24 jam setelah shipped jika buyer tidak respons.",
              color: "bg-white",
              border: "border-slate-200",
            },
            {
              icon: <Scale className="text-amber-400" size={20} />,
              title: "Resolusi On-Chain",
              desc: "Semua keputusan tercatat permanen di blockchain. Transparan & immutable.",
              color: "bg-white",
              border: "border-slate-200",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`bg-white border ${f.border} shadow-sm rounded-2xl p-5 hover:border-violet-300 transition-colors`}
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Main Panel ──────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs">1</span>
                Connect Wallet
              </h2>
              {!address ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 mb-4">
                    Connect Freighter Wallet untuk mulai bertransaksi.
                  </p>
                  <WalletButton />
                  <p className="text-xs text-slate-500 mt-3">
                    Belum punya?{" "}
                    <a
                      href="https://www.freighter.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 underline"
                    >
                      Install Freighter
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Connected as</p>
                    <p className="font-mono text-xs text-emerald-700 break-all">{address}</p>
                    {address === ADMIN_ADDRESS && (
                      <span className="mt-2 inline-block text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                        👑 Admin
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Create Escrow */}
            {address && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs">2</span>
                  Buat Escrow
                </h2>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Lock XLM sebagai buyer. Dana aman di smart contract sampai
                  seller kirim dan kamu konfirmasi.
                </p>
                <DepositForm onSuccess={(txnId) => {
                  setActiveTxnId(txnId);
                  setTab("lookup");
                }} />
              </div>
            )}

            {/* Network Info */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Network Info</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Network", value: "Testnet" },
                  { label: "Protocol", value: "22" },
                  { label: "SDK", value: "soroban-sdk v26" },
                  { label: "Stake Dispute", value: "2 XLM" },
                  { label: "Auto-Release", value: "24 jam" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-slate-500">
                    <span>{label}</span>
                    <span className="text-slate-700 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Lookup */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setTab("lookup")}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                    tab === "lookup"
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cari Transaksi
                </button>
                <button
                  onClick={() => setTab("about")}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                    tab === "about"
                      ? "border-violet-600 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Alur Escrow
                </button>
              </div>
              {tab === "lookup" && <LookupPanel autoFetchId={activeTxnId} />}

              {tab === "about" && (
                <div className="space-y-4">
                  {(() => {
                    // Static class map — wajib ada agar tidak dipurge Tailwind saat build production
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
                        title: "Deposit Escrow",
                        desc: 'Buyer lock XLM ke smart contract. Status jadi "Pending". Dana aman di kontrak hingga flow selesai.',
                      },
                      {
                        step: "2", actor: "Seller", color: "blue",
                        title: "Mark as Shipped",
                        desc: 'Seller kirim barang/jasa, lalu mark shipped. Status jadi "Shipped". Timer 24 jam mulai berjalan.',
                      },
                      {
                        step: "3A", actor: "Buyer", color: "emerald",
                        title: "Confirm Receipt",
                        desc: 'Buyer puas → konfirmasi terima. Dana langsung ke seller. Status "Resolved". Selesai!',
                      },
                      {
                        step: "3B", actor: "Siapapun", color: "amber",
                        title: "Auto Release (24 jam)",
                        desc: "Jika buyer tidak respons 24 jam, siapapun bisa trigger auto-release. Dana ke seller otomatis.",
                      },
                      {
                        step: "3C", actor: "Buyer", color: "red",
                        title: "Open Dispute (+2 XLM stake)",
                        desc: "Buyer tidak puas? Buka dispute + 2 XLM stake. Diskusi via Chat Room dengan admin & seller.",
                      },
                      {
                        step: "4", actor: "Admin", color: "purple",
                        title: "Resolve Dispute",
                        desc: "Admin review chat & putuskan. Buyer menang: refund + stake kembali. Seller menang: dapat dana, stake ke treasury.",
                      },
                    ].map((s) => (
                      <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center font-bold text-sm ${stepColors[s.color]?.badge ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {s.step}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">{s.actor}</p>
                          <p className="font-semibold text-slate-900 text-sm mb-1">{s.title}</p>
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
