"use client";
// src/components/ChatRoom.tsx
// Chat antara Buyer, Seller, dan Admin untuk setiap transaksi escrow

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { Send, Loader2, MessageSquare, Lock } from "lucide-react";
import { ADMIN_ADDRESS, TxStatus, isFinalStatus } from "@/lib/stellar";

interface ChatMessage {
  id:        string;
  txnId:     number;
  sender:    string;
  text:      string;
  timestamp: number;
}

interface ChatRoomProps {
  txnId:  number;
  buyer:  string;
  seller: string;
  status: TxStatus; // untuk disable input saat transaksi final
}

const MAX_CHARS = 500;

export default function ChatRoom({ txnId, buyer, seller, status }: ChatRoomProps) {
  const { address } = useWallet();
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [inputText,   setInputText]   = useState("");
  const [loading,     setLoading]     = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sendError,   setSendError]   = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Polling pesan setiap 3 detik ─────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?txnId=${txnId}`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
      }
    } catch {
      // Gagal fetch tidak perlu panic, coba lagi di interval berikutnya
    } finally {
      setInitialLoad(false);
    }
  }, [txnId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ── Auto-scroll ke pesan terbaru ─────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Kirim pesan ───────────────────────────────────────────────────────────
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !address || isFinalStatus(status)) return;

    setLoading(true);
    setSendError(null);
    setInputText(""); // Optimistic clear

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnId, sender: address, text }),
      });

      if (res.ok) {
        const newMsg: ChatMessage = await res.json();
        // Tambah optimistic, polling akan sync ulang dalam 3 detik
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === newMsg.id);
          return alreadyExists ? prev : [...prev, newMsg];
        });
      } else {
        const err = await res.json().catch(() => ({ error: "Gagal mengirim pesan" }));
        setSendError(err.error || "Gagal mengirim pesan");
        setInputText(text); // Kembalikan teks jika gagal
      }
    } catch {
      setSendError("Tidak ada koneksi. Coba lagi.");
      setInputText(text);
    } finally {
      setLoading(false);
    }
  }

  // ── Role helpers ──────────────────────────────────────────────────────────
  const getRole = (sender: string): string => {
    if (sender === ADMIN_ADDRESS) return "Admin 👑";
    if (sender === buyer)         return "Buyer";
    if (sender === seller)        return "Seller";
    return "Tamu";
  };

  // Setiap peran punya warna tetap agar mudah dibedakan siapapun yang baca
  const getBubbleStyle = (sender: string, isMe: boolean): string => {
    if (isMe) {
      // Pesan saya sendiri selalu violet — jelas milikku
      return "bg-violet-600 text-white rounded-br-none shadow-violet-200";
    }
    if (sender === ADMIN_ADDRESS) {
      return "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none";
    }
    if (sender === buyer) {
      // Buyer = biru (ingat: bisa saja "kamu" kalau kamu seller, maka biru = lawan bicara)
      return "bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-none";
    }
    if (sender === seller) {
      // Seller = hijau
      return "bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-bl-none";
    }
    return "bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-none";
  };

  const getRoleBadgeStyle = (sender: string): string => {
    if (sender === ADMIN_ADDRESS) return "text-amber-600 font-bold";
    if (sender === buyer)         return "text-blue-600 font-bold";
    if (sender === seller)        return "text-emerald-600 font-bold";
    return "text-slate-500";
  };

  const myRole     = getRole(address ?? "");
  const isFinal    = isFinalStatus(status);
  const canSend    = !!address && (address === buyer || address === seller || address === ADMIN_ADDRESS) && !isFinal;
  const charsLeft  = MAX_CHARS - inputText.length;
  const charsWarn  = charsLeft <= 50;

  // ── Tidak ada wallet ──────────────────────────────────────────────────────
  if (!address) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl h-[420px] flex flex-col items-center justify-center gap-3 p-6 text-center shadow-sm">
        <MessageSquare className="text-slate-300" size={32} />
        <p className="text-slate-500 text-sm font-medium">Connect wallet untuk melihat chat.</p>
      </div>
    );
  }

  // ── Render utama ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[520px] shadow-sm overflow-hidden">

      {/* Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-violet-500" />
            <span className="font-bold text-slate-900 text-sm">Chat Room</span>
            <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              #{txnId}
            </span>
          </div>
          {/* Badge peran user saat ini */}
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
            myRole.includes("Admin")  ? "bg-amber-100 border-amber-200 text-amber-700" :
            myRole === "Buyer"        ? "bg-blue-100 border-blue-200 text-blue-700" :
            myRole === "Seller"       ? "bg-emerald-100 border-emerald-200 text-emerald-700" :
            "bg-slate-100 border-slate-200 text-slate-500"
          }`}>
            {myRole}
          </span>
        </div>

        {/* Peserta ─────────────────────────────────────────────────────── */}
        <div className="mt-2 flex flex-wrap gap-2">
          <ParticipantChip label="Buyer"  addr={buyer}         color="blue" />
          <ParticipantChip label="Seller" addr={seller}        color="emerald" />
          <ParticipantChip label="Admin"  addr={ADMIN_ADDRESS} color="amber" />
        </div>
      </div>

      {/* Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto bg-slate-50/40 flex flex-col gap-3"
      >
        {initialLoad ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-slate-400" size={22} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="text-slate-300" size={28} />
            <p className="text-sm text-slate-400">
              {isFinal
                ? "Transaksi selesai. Arsip chat di atas."
                : "Belum ada pesan. Mulai percakapan!"}
            </p>
            {!isFinal && canSend && (
              <p className="text-xs text-slate-400">
                Buyer, Seller, dan Admin bisa saling chat di sini.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === address;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[88%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                {/* Meta: role + address + waktu */}
                <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <span className={`text-[10px] ${isMe ? "text-violet-500 font-bold" : getRoleBadgeStyle(msg.sender)}`}>
                    {isMe ? "Kamu" : getRole(msg.sender)}
                  </span>
                  {!isMe && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {msg.sender.slice(0, 4)}…{msg.sender.slice(-4)}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Bubble ────────────────────────────────────────────── */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${getBubbleStyle(msg.sender, isMe)}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input / Footer ─────────────────────────────────────────────────── */}
      {isFinal ? (
        /* Transaksi sudah selesai — read-only mode */
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-slate-500">
          <Lock size={13} className="shrink-0" />
          <p className="text-xs">Chat read-only — transaksi sudah {status}.</p>
        </div>
      ) : canSend ? (
        /* Form kirim pesan */
        <div className="border-t border-slate-100 bg-white">
          {sendError && (
            <p className="px-4 pt-2 text-xs text-red-500 font-medium">⚠️ {sendError}</p>
          )}
          <form onSubmit={sendMessage} className="p-3 flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setInputText(e.target.value);
                    setSendError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Tulis pesan… (Enter untuk kirim)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-400 transition-colors"
                disabled={loading}
                maxLength={MAX_CHARS}
              />
              {/* Character counter — tampil saat mendekati limit */}
              {inputText.length > 0 && (
                <span className={`text-[10px] text-right pr-1 ${charsWarn ? "text-red-500 font-medium" : "text-slate-400"}`}>
                  {charsLeft} karakter tersisa
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="self-start mt-0.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center min-w-[44px]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      ) : (
        /* Bukan peserta */
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-xs text-slate-500">
            Kamu bukan peserta transaksi ini. Chat hanya untuk Buyer, Seller, dan Admin.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Helper component: chip peserta ────────────────────────────────────────────
function ParticipantChip({
  label, addr, color,
}: {
  label: string;
  addr: string;
  color: "blue" | "emerald" | "amber";
}) {
  const styles = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber:   "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${styles[color]}`}>
      <span className="font-semibold">{label}</span>
      <span className="font-mono opacity-70">
        {addr.slice(0, 4)}…{addr.slice(-4)}
      </span>
    </div>
  );
}
