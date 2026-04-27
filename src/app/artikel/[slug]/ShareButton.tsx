"use client";

import { useState } from "react";
import { Share2, Link2, Twitter, Facebook, Check } from "lucide-react";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " — " + url)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.13.558 4.13 1.535 5.867L.057 23.569a.75.75 0 00.974.874l5.852-1.537A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.528-5.214-1.444l-.374-.231-3.88 1.019 1.034-3.773-.243-.387A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      ),
      color: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]",
    },
    {
      label: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: <Twitter size={16} />,
      color: "hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <Facebook size={16} />,
      color: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
          open
            ? "bg-brand text-white border-brand"
            : "border-slate-200 text-slate-500 hover:text-brand hover:border-brand"
        }`}
        title="Bagikan artikel"
      >
        <Share2 size={16} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-20 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(30,58,138,0.15)] border border-slate-100 p-2 min-w-[180px] animate-fade-up">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 pt-1 pb-2">Bagikan ke</p>

            {shareLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-transparent transition-all duration-200 ${s.color}`}
              >
                {s.icon}
                {s.label}
              </a>
            ))}

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-transparent hover:bg-slate-50 transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-500" />
                    <span className="text-green-600">Link tersalin!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={16} />
                    Salin Link
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
