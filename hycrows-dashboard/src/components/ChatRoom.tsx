"use client";
// src/components/ChatRoom.tsx

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
  status: TxStatus; 
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

  // ── 3-second polling ─────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?txnId=${txnId}`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
        setMessages(data);
      }
    } catch {
      // Silent catch on fetch failure, will retry next interval
    } finally {
      setInitialLoad(false);
    }
  }, [txnId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ── Auto-scroll to latest ─────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
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
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === newMsg.id);
          return alreadyExists ? prev : [...prev, newMsg];
        });
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to send message" }));
        setSendError(err.error || "Failed to send message");
        setInputText(text); // Restore text on failure
      }
    } catch {
      setSendError("Connection error. Please try again.");
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
    return "Guest";
  };

  const getBubbleStyle = (sender: string, isMe: boolean): string => {
    if (isMe) return "bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-500/20";
    if (sender === ADMIN_ADDRESS) return "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none shadow-sm";
    if (sender === buyer) return "bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-none shadow-sm";
    if (sender === seller) return "bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-bl-none shadow-sm";
    return "bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-none shadow-sm";
  };

  const getRoleBadgeStyle = (sender: string): string => {
    if (sender === ADMIN_ADDRESS) return "text-amber-600 font-bold";
    if (sender === buyer)         return "text-blue-600 font-bold";
    if (sender === seller)        return "text-emerald-600 font-bold";
    return "text-slate-500 font-medium";
  };

  const myRole     = getRole(address ?? "");
  const isFinal    = isFinalStatus(status);
  const canSend    = !!address && (address === buyer || address === seller || address === ADMIN_ADDRESS) && !isFinal;
  const charsLeft  = MAX_CHARS - inputText.length;
  const charsWarn  = charsLeft <= 50;

  // ── Disconnected State ──────────────────────────────────────────────────────
  if (!address) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl h-[350px] sm:h-[450px] flex flex-col items-center justify-center gap-4 p-6 text-center shadow-sm">
        <div className="bg-slate-100 p-4 rounded-full text-slate-400">
          <MessageSquare size={32} />
        </div>
        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Connect your wallet to view the chat.</p>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl flex flex-col h-[400px] sm:h-[500px] shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">

      {/* Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10 shadow-sm flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-violet-100 p-1.5 rounded-lg text-violet-600">
              <MessageSquare size={16} />
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight">Chat Room</span>
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              #{txnId}
            </span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${
            myRole.includes("Admin")  ? "bg-amber-100 border-amber-200 text-amber-700" :
            myRole === "Buyer"        ? "bg-blue-100 border-blue-200 text-blue-700" :
            myRole === "Seller"       ? "bg-emerald-100 border-emerald-200 text-emerald-700" :
            "bg-slate-100 border-slate-200 text-slate-500"
          }`}>
            {myRole}
          </span>
        </div>

        {/* Participants ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2.5">
          <ParticipantChip label="Buyer"  addr={buyer}         color="blue" />
          <ParticipantChip label="Seller" addr={seller}        color="emerald" />
          <ParticipantChip label="Admin"  addr={ADMIN_ADDRESS} color="amber" />
        </div>
      </div>

      {/* Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 p-5 overflow-y-auto bg-slate-50/50 flex flex-col gap-4 relative"
        style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      >
        {initialLoad ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="bg-white p-4 rounded-full border border-slate-200 shadow-sm text-slate-300">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm font-bold text-slate-600">
              {isFinal
                ? "Transaction resolved. Chat archived."
                : "No messages yet. Start the conversation!"}
            </p>
            {!isFinal && canSend && (
              <p className="text-xs text-slate-500 max-w-[250px] leading-relaxed">
                The Buyer, Seller, and Admin can communicate here securely.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === address;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] animate-in slide-in-from-bottom-2 duration-300 ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                {/* Meta */}
                <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <span className={`text-[10px] uppercase tracking-wider ${isMe ? "text-violet-600 font-black" : getRoleBadgeStyle(msg.sender)}`}>
                    {isMe ? "You" : getRole(msg.sender)}
                  </span>
                  {!isMe && (
                    <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1 rounded">
                      {msg.sender.slice(0, 4)}…{msg.sender.slice(-4)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium ${getBubbleStyle(msg.sender, isMe)}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input / Footer ─────────────────────────────────────────────────── */}
      {isFinal ? (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-2 text-slate-500">
          <Lock size={14} className="shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider">Read-only mode — transaction is {status}.</p>
        </div>
      ) : canSend ? (
        <div className="border-t border-slate-100 bg-white p-3">
          {sendError && (
            <p className="px-4 pb-2 text-xs text-red-500 font-bold flex items-center gap-1">⚠️ {sendError}</p>
          )}
          <form onSubmit={sendMessage} className="flex gap-2">
            <div className="flex-1 flex flex-col relative">
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
                placeholder="Write a message… (Enter to send)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-16 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-800 placeholder-slate-400 transition-all font-medium"
                disabled={loading}
                maxLength={MAX_CHARS}
              />
              {/* Character counter */}
              {inputText.length > 0 && (
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold ${charsWarn ? "text-red-500" : "text-slate-300"}`}>
                  {charsLeft}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 text-white px-4 rounded-2xl transition-all flex items-center justify-center min-w-[50px] shadow-md shadow-violet-500/30"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-xs text-slate-500 font-medium">
            You are not a participant in this transaction. Chat is restricted to the Buyer, Seller, and Admin.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Helper component ────────────────────────────────────────────
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
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] ${styles[color]}`}>
      <span className="font-black uppercase tracking-wider">{label}</span>
      <span className="font-mono bg-white/50 px-1 rounded font-medium">
        {addr.slice(0, 4)}…{addr.slice(-4)}
      </span>
    </div>
  );
}
