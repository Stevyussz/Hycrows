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
  Info,
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

  // Auto-release available if >= 24 hours since shipped.
  // Using local time as an estimation; contract enforces exact time.
  const nowSecs = BigInt(Math.floor(Date.now() / 1000));
  const autoReleaseAvailable =
    txn.status === "Shipped" &&
    txn.shipped_timestamp > 0n &&
    nowSecs >= txn.shipped_timestamp + 86400n;

  // Time remaining until auto-release (for display)
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
      // Refresh data after 2 seconds to allow indexer to catch up
      setTimeout(onRefresh, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  }

  const explorerBase = "https://stellar.expert/explorer/testnet/tx/";
  const finished = isFinalStatus(txn.status);

  return (
    <div className="relative bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">TXN #{txn.transaction_id.toString()}</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {stroopsToXlm(txn.amount)} <span className="text-sm font-bold text-slate-400">XLM</span>
            {txn.stake_amount > 0n && (
              <span className="ml-2 text-sm text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                + {stroopsToXlm(txn.stake_amount)} stake
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-black uppercase tracking-wide px-3 py-1.5 rounded-full border shadow-sm ${STATUS_COLOR[txn.status]}`}>
            {txn.status}
          </span>
          {/* Manual refresh button */}
          <button
            onClick={onRefresh}
            disabled={!!loading}
            title="Refresh data"
            className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all disabled:opacity-40 shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Parties */}
      <div className="space-y-3 mb-6 text-sm bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Buyer</span>
          <span className={`font-mono text-xs truncate max-w-[200px] sm:max-w-[300px] ${isBuyer ? "text-violet-600 font-bold bg-violet-50 px-2 py-1 rounded" : "text-slate-600"}`}>
            {txn.buyer}
            {isBuyer && <span className="ml-1 text-violet-400 font-medium normal-case">(you)</span>}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Seller</span>
          <span className={`font-mono text-xs truncate max-w-[200px] sm:max-w-[300px] ${isSeller ? "text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded" : "text-slate-600"}`}>
            {txn.seller}
            {isSeller && <span className="ml-1 text-emerald-400 font-medium normal-case">(you)</span>}
          </span>
        </div>

        {txn.shipped_timestamp > 0n && (
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-3">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium text-xs uppercase tracking-wider">
              <Clock size={14} />
              Shipped At
            </span>
            <span className="text-xs text-slate-700 font-medium bg-white px-2 py-1 rounded-md border border-slate-200">
              {formatTimestamp(txn.shipped_timestamp)}
            </span>
          </div>
        )}

        {/* Auto-release countdown info */}
        {txn.status === "Shipped" && !autoReleaseAvailable && secsUntilRelease > 0 && (
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 font-medium mt-3">
            <Zap size={14} className="shrink-0" />
            Auto-release available in{" "}
            <span className="font-bold bg-white px-1.5 py-0.5 rounded shadow-sm text-blue-600 border border-blue-100">
              {Math.ceil(secsUntilRelease / 3600)} hours
            </span>
          </div>
        )}

        {/* Final status info */}
        {finished && (
          <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2 shadow-sm mt-3 font-medium">
            <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            This transaction is resolved and permanently recorded on the blockchain.
          </div>
        )}
      </div>

      {/* Actions — hide if finished */}
      {!finished && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
          {/* Seller: Mark Shipped */}
          {isSeller && txn.status === "Pending" && (
            <ActionButton
              label="Mark as Shipped"
              icon={<Package size={15} />}
              color="blue"
              loading={loading === "ship"}
              onClick={() => run("ship", () => markAsShipped(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Buyer: Confirm Receipt */}
          {isBuyer && txn.status === "Shipped" && (
            <ActionButton
              label="Confirm Receipt"
              icon={<CheckCircle size={15} />}
              color="green"
              loading={loading === "confirm"}
              onClick={() => run("confirm", () => confirmReceipt(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Buyer: Open Dispute */}
          {isBuyer && txn.status === "Shipped" && (
            <ActionButton
              label="Open Dispute (2 XLM)"
              icon={<AlertTriangle size={15} />}
              color="red"
              loading={loading === "dispute"}
              onClick={() => run("dispute", () => openDispute(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Anyone: Auto Release (only if 24 hours passed) */}
          {txn.status === "Shipped" && autoReleaseAvailable && (
            <ActionButton
              label="Trigger Auto-Release"
              icon={<Zap size={15} />}
              color="amber"
              loading={loading === "auto"}
              onClick={() => run("auto", () => autoRelease(address!, Number(txn.transaction_id)))}
            />
          )}

          {/* Admin: Resolve Dispute */}
          {isAdmin && txn.status === "Disputed" && (
            <div className="w-full flex gap-2.5 mt-2 pt-4 border-t border-slate-100">
              <ActionButton
                label="Buyer Wins (Refund)"
                icon={<ShieldCheck size={15} />}
                color="green"
                loading={loading === "resolve-buyer"}
                onClick={() =>
                  run("resolve-buyer", () =>
                    resolveDispute(address!, Number(txn.transaction_id), true)
                  )
                }
              />
              <ActionButton
                label="Seller Wins (Pay)"
                icon={<ShieldX size={15} />}
                color="red"
                loading={loading === "resolve-seller"}
                onClick={() =>
                  run("resolve-seller", () =>
                    resolveDispute(address!, Number(txn.transaction_id), false)
                  )
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {txHash && (
        <a
          href={explorerBase + txHash}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 font-bold transition-colors"
        >
          <CheckCircle size={14} />
          TX Confirmed! View in Explorer
          <ExternalLink size={13} />
        </a>
      )}
      {error && (
        <p className="mt-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 font-medium flex items-start gap-1.5">
          <Info size={14} className="shrink-0 mt-0.5" />
          {error}
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
    blue:  "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white shadow-sm",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-sm",
    red:   "bg-red-50 border-red-200 text-red-700 hover:bg-red-600 hover:text-white shadow-sm",
    amber: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white shadow-sm",
  };

  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 disabled:hover:bg-inherit disabled:hover:text-inherit ${colors[color]}`}
    >
      {loading ? <span className="animate-spin inline-block">⟳</span> : icon}
      {label}
    </button>
  );
}
