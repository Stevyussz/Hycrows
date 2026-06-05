"use client";
// src/components/NotificationBell.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@/context/WalletContext";
import { Bell, X, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  txnId: number;
  from: string;
  amount: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface Props {
  onSelectTxn: (id: string) => void;
}

export default function NotificationBell({ onSelectTxn }: Props) {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/notifications?address=${address}`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch {}
  }, [address]);

  // Poll for notifications every 5 seconds
  useEffect(() => {
    if (!address) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [address, fetchNotifications]);

  // Show toast when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current >= 0) {
      const newest = notifications.find((n) => !n.read);
      if (newest) {
        toast(
          (t) => (
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => {
                onSelectTxn(newest.txnId.toString());
                toast.dismiss(t.id);
              }}
            >
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-bold text-sm text-slate-900">New Escrow Incoming!</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {newest.message || `Escrow #${newest.txnId} created`}
                </p>
                <p className="text-[10px] text-violet-500 mt-1 font-medium flex items-center gap-0.5">
                  Click to view <ArrowRight size={10} />
                </p>
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              background: "#faf5ff",
              border: "1px solid #e9d5ff",
              borderRadius: "16px",
              padding: "14px 16px",
              boxShadow: "0 8px 30px rgba(139, 92, 246, 0.15)",
            },
          }
        );
      }
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, notifications, onSelectTxn]);

  // Mark all as read
  const markAsRead = useCallback(async () => {
    if (!address) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }, [address]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!address) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAsRead();
        }}
        className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all shadow-sm"
        title="Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? "text-violet-600" : "text-slate-400"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <h3 className="text-sm font-black text-slate-800">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications
                .slice()
                .reverse()
                .map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      onSelectTxn(notif.txnId.toString());
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${
                      !notif.read ? "bg-violet-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg mt-0.5">{notif.type === "new_escrow" ? "💰" : "📢"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 leading-snug">
                          {notif.message || `New escrow #${notif.txnId} created`}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {new Date(notif.timestamp).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5 shadow-sm shadow-violet-300" />
                      )}
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
