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

/** Validate Stellar address: starts with G, 56 characters long */
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

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Reset when modal opens
  function openModal() {
    setOpen(true);
    setError(null);
    setTxHash(null);
    setForm({ txnId: "", seller: "", amount: "" });
  }

  // Validate before submit
  function validate(): string | null {
    if (!form.txnId || Number(form.txnId) <= 0)
      return "Transaction ID must be a positive number.";
    if (!form.seller || !isValidStellarAddress(form.seller))
      return "Invalid seller address. Must start with G and be 56 characters long.";
    if (address && form.seller.trim() === address)
      return "The seller cannot be the same as the buyer (you).";
    if (!form.amount || parseFloat(form.amount) <= 0)
      return "Amount must be greater than 0 XLM.";
    if (parseFloat(form.amount) < 0.1)
      return "Minimum deposit amount is 0.1 XLM.";
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
        address,              // buyer = connected wallet
        form.seller.trim(),
        parseFloat(form.amount)
      );
      const submittedTxnId = form.txnId;
      setTxHash(hash);
      // Notify Admin Tracker
      fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnId: submittedTxnId }),
      }).catch(console.error);

      // Notify the Seller about the incoming escrow
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAddress: form.seller.trim(),
          txnId: submittedTxnId,
          from: address,
          amount: form.amount,
          message: `💰 New escrow #${submittedTxnId} for ${form.amount} XLM from ${address.slice(0, 6)}…${address.slice(-4)}`,
        }),
      }).catch(console.error);

      setForm({ txnId: "", seller: "", amount: "" });
      setTimeout(() => {
        onSuccess(submittedTxnId);
        setOpen(false);
        setTxHash(null);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!address) return null;

  return (
    <div>
      <button
        onClick={openModal}
        className="flex items-center justify-center w-full gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-500/30"
      >
        <PlusCircle size={18} />
        Create New Escrow
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Create New Escrow</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your funds will be locked securely in the smart contract until you confirm receipt of the goods or services.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Transaction ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Transaction ID <span className="text-slate-400 normal-case font-medium">(unique number, e.g., 1001)</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g., 1001"
                  value={form.txnId}
                  onChange={(e) => setForm((f) => ({ ...f, txnId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm shadow-sm transition-all"
                />
              </div>

              {/* Seller Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Seller Address <span className="text-slate-400 normal-case font-medium">(Stellar address G…)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="G…"
                  value={form.seller}
                  onChange={(e) => setForm((f) => ({ ...f, seller: e.target.value }))}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 text-sm font-mono shadow-sm transition-all ${
                    form.seller && !isValidStellarAddress(form.seller)
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-violet-500 focus:ring-violet-500/20"
                  }`}
                />
                {form.seller && !isValidStellarAddress(form.seller) && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> Invalid address (must be G… 56 chars)
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  Amount <span className="text-slate-400 normal-case font-medium">(XLM, min 0.1)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    placeholder="e.g., 10"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm shadow-sm transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">XLM</span>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 shadow-sm leading-relaxed">
                <span className="font-bold">⚠️ Notice:</span> Buyer (you) = <span className="font-mono bg-amber-100 px-1 rounded">{address.slice(0, 8)}…{address.slice(-4)}</span>. 
                Ensure the Transaction ID has not been used before.
              </div>

              {/* Success */}
              {txHash && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-600 font-bold"
                  >
                    ✅ Success! View transaction
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                  <p className="text-sm text-red-600 font-bold flex items-start gap-1.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    {error}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-sm transition-colors font-bold shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/20"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Confirming…" : "Deposit Now"}
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
