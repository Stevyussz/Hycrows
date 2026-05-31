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
  const [isRefreshing, setIsRefreshing] = useState(false); // beda dari loading awal

  /**
   * Fetch transaksi by ID.
   * @param id - ID transaksi
   * @param isRefresh - true = jangan reset txn ke null (preserve UI saat refresh)
   */
  const fetchById = useCallback(async (id: string, isRefresh = false) => {
    if (!id) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setNotFound(false);
      setTxn(null); // Hanya reset saat fresh search, bukan saat refresh
    }

    try {
      const result = await fetchTransaction(Number(id));
      if (result) {
        setTxn(result);
        setNotFound(false);
      } else {
        if (!isRefresh) setNotFound(true); // Jangan ubah notFound saat refresh
      }
    } catch {
      if (!isRefresh) setNotFound(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Auto-fetch saat DepositForm sukses
  useEffect(() => {
    if (autoFetchId) {
      setTxnId(autoFetchId);
      fetchById(autoFetchId);
    }
  }, [autoFetchId, fetchById]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    fetchById(txnId, false); // Fresh search → reset UI
  }

  function handleRefresh() {
    if (txn) fetchById(String(txn.transaction_id), true); // Refresh → preserve UI
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          type="number"
          min={1}
          placeholder="Cari Transaction ID…"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !txnId}
          className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Cari
        </button>
      </form>

      {notFound && !txn && (
        <p className="text-sm text-slate-500 text-center py-4">
          Transaksi tidak ditemukan untuk ID <span className="font-mono font-semibold">{txnId}</span>.
        </p>
      )}

      {txn && (
        <div className="space-y-4">
          {/* Indikator refresh — tampil overlay tipis, tidak hapus konten */}
          {isRefreshing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              Memperbarui data…
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <TransactionCard
                txn={txn}
                // Refresh = preserve mode, data tetap terlihat selama fetch
                onRefresh={handleRefresh}
              />
            </div>
            <div>
              {/* Kirim status ke ChatRoom agar bisa read-only saat transaksi final */}
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
