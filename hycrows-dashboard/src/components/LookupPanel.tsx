"use client";
// src/components/LookupPanel.tsx

import { useState, useEffect, useCallback } from "react";
import { fetchTransaction, EscrowTransaction } from "@/lib/stellar";
import TransactionCard from "./TransactionCard";
import ChatRoom from "./ChatRoom";
import { Search, Loader2, RefreshCw } from "lucide-react";

interface Props {
  autoFetchId?: string;
}

export default function LookupPanel({ autoFetchId }: Props = {}) {
  const [txnId,    setTxnId]    = useState(autoFetchId || "");
  const [txn,      setTxn]      = useState<EscrowTransaction | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); 

  /**
   * Fetch transaction by ID.
   * @param id - Transaction ID
   * @param isRefresh - true = don't reset txn to null (preserve UI during refresh)
   * @param isSilent - true = don't show the "Updating data..." UI indicator
   */
  const fetchById = useCallback(async (id: string, isRefresh = false, isSilent = false) => {
    if (!id) return;

    if (isRefresh) {
      if (!isSilent) setIsRefreshing(true);
    } else {
      setLoading(true);
      setNotFound(false);
      setTxn(null); // Only reset on fresh search, not on refresh
    }

    try {
      const result = await fetchTransaction(Number(id));
      if (result) {
        setTxn(result);
        setNotFound(false);
        // Notify Admin Tracker (fire and forget)
        fetch("/api/tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txnId: id }),
        }).catch(() => {});
      } else {
        if (!isRefresh) setNotFound(true); 
      }
    } catch {
      if (!isRefresh) setNotFound(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false); // Can safely reset since it won't hurt silent mode
    }
  }, []);

  // Auto-fetch when DepositForm succeeds
  useEffect(() => {
    if (autoFetchId) {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setTxnId(autoFetchId);
      fetchById(autoFetchId);
    }
  }, [autoFetchId, fetchById]);

  // Real-time silent background polling every 5 seconds
  useEffect(() => {
    if (!txn) return;
    const interval = setInterval(() => {
      fetchById(String(txn.transaction_id), true, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [txn?.transaction_id, fetchById]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    fetchById(txnId, false); // Fresh search → reset UI
  }

  function handleRefresh() {
    if (txn) fetchById(String(txn.transaction_id), true, false); // Manual Refresh → preserve UI, show indicator
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Search bar */}
      <form onSubmit={handleLookup} className="flex gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="number"
            min={1}
            placeholder="Search Transaction ID…"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm shadow-sm transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !txnId}
          className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-slate-900/10 flex items-center gap-2 text-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
        </button>
      </form>

      {notFound && !txn && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center animate-in slide-in-from-top-2">
          <p className="text-sm text-red-600 font-medium">
            Transaction not found for ID <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded">{txnId}</span>.
          </p>
        </div>
      )}

      {loading && !isRefreshing && (
        <div className="grid lg:grid-cols-2 gap-5 animate-pulse">
          <div className="bg-white border border-slate-200 rounded-2xl h-80 shadow-sm p-6 flex flex-col gap-4">
            <div className="w-1/3 h-6 bg-slate-100 rounded-lg" />
            <div className="w-full h-12 bg-slate-50 rounded-xl mt-4" />
            <div className="flex-1 space-y-3 mt-4">
              <div className="w-full h-8 bg-slate-50 rounded-lg" />
              <div className="w-5/6 h-8 bg-slate-50 rounded-lg" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl h-80 shadow-sm p-6 flex flex-col">
            <div className="w-1/4 h-6 bg-slate-100 rounded-lg mb-6" />
            <div className="flex-1 flex flex-col gap-4">
              <div className="w-2/3 h-12 bg-slate-50 rounded-xl self-end" />
              <div className="w-2/3 h-12 bg-slate-50 rounded-xl self-start" />
            </div>
          </div>
        </div>
      )}

      {txn && !loading && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          {/* Refresh indicator — minimal overlay, doesn't wipe content */}
          {isRefreshing && (
            <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 border border-violet-100 w-fit px-3 py-1.5 rounded-full font-bold shadow-sm">
              <RefreshCw size={12} className="animate-spin" />
              Updating data…
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            <div>
              <TransactionCard
                txn={txn}
                onRefresh={handleRefresh}
              />
            </div>
            <div>
              <ChatRoom
                txnId={Number(txn.transaction_id)}
                buyer={txn.buyer}
                seller={txn.seller}
                status={txn.status}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
