"use client";
// src/components/TransactionCard.tsx

import {
  EscrowTransaction,
  STATUS_COLOR,
  stroopsToXlm,
  formatTimestamp,
  isFinalStatus,
} from "@/lib/stellar";
import { useWallet } from "@/context/WalletContext";
import {
  markAsShipped,
  confirmReceipt,
  openDispute,
  autoRelease,
  resolveDispute,
  ADMIN_ADDRESS,
} from "@/lib/stellar";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Zap,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface Props {
  txn:       EscrowTransaction;
  onRefresh: () => void;
}

export default function TransactionCard({ txn, onRefresh }: Props) {
  const { address } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [txHash,  setTxHash]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const isBuyer  = address === txn.buyer;
  const isSeller = address === txn.seller;
  const isAdmin  = address === ADMIN_ADDRESS;

  // Auto-release tersedia jika sudah >= 24 jam sejak shipped.
  // Menggunakan waktu lokal sebagai estimasi; kontrak yang menentukan final.
  const nowSecs = BigInt(Math.floor(Date.now() / 1000));
  const autoReleaseAvailable =
    txn.status === "Shipped" &&
    txn.shipped_timestamp > 0n &&
    nowSecs >= txn.shipped_timestamp + 86400n;

  // Waktu tersisa hingga auto-release (untuk display)
  const secsUntilRelease =
    txn.status === "Shipped" && txn.shipped_timestamp > 0n
      ? Number(txn.shipped_timestamp + 86400n - nowSecs)
      : 0;

  async function run(label: string, fn: () => Promise<string>) {
    setLoading(label);
    setError(null);
    setTxHash(null);
    try {
      const hash = await fn();
      setTxHash(hash);
      // Refresh data setelah 2 detik beri waktu indexer
      setTimeout(onRefresh, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(null);
    }
  }

  const explorerBase = "https://stellar.expert/explorer/testnet/tx/";
  const finished = isFinalStatus(txn.status);

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-violet-300 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 font-mono">TXN #{txn.transaction_id.toString()}</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {stroopsToXlm(txn.amount)} XLM
            {txn.stake_amount > 0n && (
              <span className="ml-2 text-sm text-amber-600">
                + {stroopsToXlm(txn.stake_amount)} stake
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[txn.status]}`}>
            {txn.status}
          </span>
          {/* Tombol refresh manual */}
          <button
            onClick={onRefresh}
            disabled={!!loading}
            title="Refresh data"
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Parties */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-14 shrink-0">Buyer</span>
          <span className={`font-mono text-xs truncate ${isBuyer ? "text-violet-600 font-semibold" : "text-slate-600"}`}>
            {txn.buyer}
            {isBuyer && <span className="ml-1 text-violet-400">(kamu)</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-14 shrink-0">Seller</span>
          <span className={`font-mono text-xs truncate ${isSeller ? "text-emerald-600 font-semibold" : "text-slate-600"}`}>
            {txn.seller}
            {isSeller && <span className="ml-1 text-emerald-400">(kamu)</span>}
          </span>
        </div>

        {txn.shipped_timestamp > 0n && (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Clock size={12} />
            Shipped: {formatTimestamp(txn.shipped_timestamp)}
          </div>
        )}

        {/* Info countdown auto-release */}
        {txn.status === "Shipped" && !autoReleaseAvailable && secsUntilRelease > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Zap size={12} />
            Auto-release dalam{" "}
            <span className="font-semibold">
              {Math.ceil(secsUntilRelease / 3600)} jam
            </span>
          </div>
        )}

        {/* Info transaksi final */}
        {finished && (
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            ✅ Transaksi ini sudah selesai dan tidak bisa diubah.
          </div>
        )}
      </div>

      {/* Actions — sembunyikan jika sudah final */}
      {!finished && (
        <div className="flex flex-wrap gap-2">
          {/* Seller: Mark Shipped */}
          {isSeller && txn.status === "Pending" && (
            <ActionButton
              label="Mark as Shipped"
              icon={<Package size={14} />}
              color="blue"
              loading={loading === "ship"}
              onClick={() => run("ship", () => markAsShipped(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Buyer: Confirm Receipt */}
          {isBuyer && txn.status === "Shipped" && (
            <ActionButton
              label="Konfirmasi Terima"
              icon={<CheckCircle size={14} />}
              color="green"
              loading={loading === "confirm"}
              onClick={() => run("confirm", () => confirmReceipt(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Buyer: Open Dispute */}
          {isBuyer && txn.status === "Shipped" && (
            <ActionButton
              label="Buka Dispute (2 XLM)"
              icon={<AlertTriangle size={14} />}
              color="red"
              loading={loading === "dispute"}
              onClick={() => run("dispute", () => openDispute(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Anyone: Auto Release (hanya tampil jika 24 jam sudah habis) */}
          {txn.status === "Shipped" && autoReleaseAvailable && (
            <ActionButton
              label="Auto Release"
              icon={<Zap size={14} />}
              color="amber"
              loading={loading === "auto"}
              onClick={() => run("auto", () => autoRelease(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Admin: Resolve Dispute */}
          {isAdmin && txn.status === "Disputed" && (
            <>
              <ActionButton
                label="Buyer Menang (Refund)"
                icon={<ShieldCheck size={14} />}
                color="green"
                loading={loading === "resolve-buyer"}
                onClick={() =>
                  run("resolve-buyer", () =>
                    resolveDispute(address!, Number(txn.transaction_id), true)
                  )
                }
              />
              <ActionButton
                label="Seller Menang (Bayar)"
                icon={<ShieldX size={14} />}
                color="red"
                loading={loading === "resolve-seller"}
                onClick={() =>
                  run("resolve-seller", () =>
                    resolveDispute(address!, Number(txn.transaction_id), false)
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {/* Feedback */}
      {txHash && (
        <a
          href={explorerBase + txHash}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-500 font-medium"
        >
          <CheckCircle size={12} />
          TX Dikonfirmasi! Lihat di Explorer
          <ExternalLink size={11} />
        </a>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-500 font-medium break-words">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

function ActionButton({
  label, icon, color, loading, onClick,
}: {
  label:   string;
  icon:    React.ReactNode;
  color:   "blue" | "green" | "red" | "amber";
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    blue:  "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    red:   "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    amber: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
  };

  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? <span className="animate-spin inline-block">⟳</span> : icon}
      {label}
    </button>
  );
}
