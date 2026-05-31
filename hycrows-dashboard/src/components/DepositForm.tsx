"use client";
// src/components/DepositForm.tsx

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@/context/WalletContext";
import { depositEscrow } from "@/lib/stellar";
import { PlusCircle, ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface Props {
  onSuccess: (txnId: string) => void;
}

/** Validasi Stellar address: dimulai G, panjang 56 karakter */
function isValidStellarAddress(addr: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(addr.trim());
}

export default function DepositForm({ onSuccess }: Props) {
  const { address } = useWallet();
  const [open,    setOpen]    = useState(false);
  const [form,    setForm]    = useState({ txnId: "", seller: "", amount: "" });
  const [loading, setLoading] = useState(false);
  const [txHash,  setTxHash]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Reset saat modal dibuka
  function openModal() {
    setOpen(true);
    setError(null);
    setTxHash(null);
    setForm({ txnId: "", seller: "", amount: "" });
  }

  // Validasi sebelum submit
  function validate(): string | null {
    if (!form.txnId || Number(form.txnId) <= 0)
      return "Transaction ID harus angka positif.";
    if (!form.seller || !isValidStellarAddress(form.seller))
      return "Alamat seller tidak valid. Harus dimulai dengan G dan 56 karakter.";
    if (address && form.seller.trim() === address)
      return "Seller tidak boleh sama dengan buyer (kamu sendiri).";
    if (!form.amount || parseFloat(form.amount) <= 0)
      return "Jumlah harus lebih dari 0 XLM.";
    if (parseFloat(form.amount) < 0.1)
      return "Jumlah minimum deposit adalah 0.1 XLM.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const hash = await depositEscrow(
        address,
        Number(form.txnId),
        address,              // buyer = wallet yang connect
        form.seller.trim(),
        parseFloat(form.amount)
      );
      const submittedTxnId = form.txnId;
      setTxHash(hash);
      setForm({ txnId: "", seller: "", amount: "" });
      setTimeout(() => {
        onSuccess(submittedTxnId);
        setOpen(false);
        setTxHash(null);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tak terduga");
    } finally {
      setLoading(false);
    }
  }

  if (!address) return null;

  return (
    <div>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20"
      >
        <PlusCircle size={16} />
        Buat Escrow Baru
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative my-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Buat Escrow Baru</h2>
            <p className="text-sm text-slate-500 mb-6">
              Dana akan dikunci di smart contract sampai barang/jasa diterima.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction ID */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                  Transaction ID <span className="text-slate-400">(angka unik, contoh: 1001)</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="contoh: 1001"
                  value={form.txnId}
                  onChange={(e) => setForm((f) => ({ ...f, txnId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm shadow-sm"
                />
              </div>

              {/* Seller Address */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                  Alamat Seller <span className="text-slate-400">(Stellar address G…)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="G…"
                  value={form.seller}
                  onChange={(e) => setForm((f) => ({ ...f, seller: e.target.value }))}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 text-sm font-mono shadow-sm transition-colors ${
                    form.seller && !isValidStellarAddress(form.seller)
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-violet-500 focus:ring-violet-500"
                  }`}
                />
                {form.seller && !isValidStellarAddress(form.seller) && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Alamat tidak valid (harus G… 56 karakter)
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                  Jumlah <span className="text-slate-400">(XLM, minimum 0.1)</span>
                </label>
                <input
                  type="number"
                  required
                  min={0.1}
                  step={0.1}
                  placeholder="contoh: 10"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm shadow-sm"
                />
              </div>

              {/* Info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 shadow-sm">
                ⚠️ Buyer (kamu) = <span className="font-mono">{address.slice(0, 8)}…{address.slice(-4)}</span>.
                Pastikan Transaction ID belum pernah dipakai.
              </div>

              {/* Success */}
              {txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  ✅ Berhasil! Lihat transaksi
                  <ExternalLink size={11} />
                </a>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 font-medium flex items-start gap-1">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  {error}
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-sm transition-colors font-medium shadow-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Menunggu konfirmasi…" : "Deposit Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
