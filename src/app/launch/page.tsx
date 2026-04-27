"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SoundEngine } from "./SoundEngine";

type Phase = "idle" | "charging" | "video";

export default function LaunchPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const snd = useRef(new SoundEngine());
  const [phase, setPhase] = useState<Phase>("idle");
  const [videoReady, setVideoReady] = useState(false);

  const [stars] = useState(() =>
    Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.4,
      op: Math.random() * 0.7 + 0.2,
      dur: Math.random() * 3 + 2,
      del: Math.random() * 8,
    }))
  );

  // Preload video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    const onCanPlay = () => setVideoReady(true);
    video.addEventListener("canplaythrough", onCanPlay);
    return () => video.removeEventListener("canplaythrough", onCanPlay);
  }, []);

  const handleWish = useCallback(() => {
    if (phase !== "idle") return;
    const s = snd.current;
    s.init();
    s.playClick();
    setPhase("charging");
    s.playCharge();

    setTimeout(() => {
      setPhase("video");
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {
          // If autoplay blocked, redirect anyway
          router.push("/");
        });
      }
    }, 2200);
  }, [phase, router]);

  const handleVideoEnd = useCallback(() => {
    router.push("/");
  }, [router]);

  const isCharging = phase === "charging";
  const isVideo = phase === "video";

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center select-none"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #1a0533 0%, #09000f 45%, #000008 100%)" }}
    >
      {/* Preloaded video — always in DOM, shown when phase=video */}
      <video
        ref={videoRef}
        src="/Upscaler-4K - Ultimate-Gacha HSR.mp4"
        className="absolute inset-0 w-full h-full object-cover z-50 transition-opacity duration-700"
        style={{ opacity: isVideo ? 1 : 0, pointerEvents: isVideo ? "auto" : "none" }}
        onEnded={handleVideoEnd}
        playsInline
        preload="auto"
      />

      {/* Redirect button overlay (in case video controls are hidden) */}
      {isVideo && (
        <button
          onClick={() => router.push("/")}
          className="absolute bottom-8 right-8 z-[60] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/30 bg-black/40 text-white/60 hover:text-white hover:bg-black/60 transition-all"
        >
          Lewati →
        </button>
      )}

      {/* Background stars */}
      <div className="absolute inset-0 z-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              opacity: s.op,
              animation: `twinkle ${s.dur}s ${s.del}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      {/* Nebula */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 45% at 20% 30%, rgba(139,92,246,0.2) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 80% 70%, rgba(59,130,246,0.15) 0%, transparent 60%),
          radial-gradient(ellipse 70% 55% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)`
      }} />

      {/* Corner decorations */}
      {["top-0 left-0", "top-0 right-0 [transform:scaleX(-1)]", "bottom-0 left-0 [transform:scaleY(-1)]", "bottom-0 right-0 [transform:scale(-1)]"].map((cls, i) => (
        <div key={i} className={`absolute ${cls} w-36 h-36 z-20 pointer-events-none opacity-40 transition-opacity duration-500`}
          style={{ opacity: isVideo ? 0 : 0.4 }}>
          <svg viewBox="0 0 80 80" fill="none">
            <path d="M0 0 L38 0 L0 38 Z" stroke="#f59e0b" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M0 0 L16 0 L0 16 Z" stroke="#a78bfa" strokeWidth="0.5" fill="rgba(167,139,250,0.1)" />
            <circle cx="38" cy="0" r="3" fill="#f59e0b" opacity="0.8" />
            <circle cx="0" cy="38" r="3" fill="#f59e0b" opacity="0.8" />
          </svg>
        </div>
      ))}

      {/* Main content (hide when video playing) */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 transition-all duration-500"
        style={{ opacity: isVideo ? 0 : 1, transform: isVideo ? "scale(0.8)" : "scale(1)" }}>

        {/* Header */}
        <div className="mb-10 transition-all duration-500"
          style={{ opacity: isCharging ? 0.4 : 1 }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] mb-2" style={{ color: "rgba(245,158,11,0.6)" }}>
            Part of Duta Persada Nusantara
          </p>
          <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.1)" }}>
            Pemuda Pendidikan Nusantara
          </h2>
        </div>

        {/* ORB */}
        <div className="relative mb-14 flex items-center justify-center"
          style={{ transition: "transform 0.5s ease", transform: isCharging ? "scale(1.8)" : "scale(1)" }}>
          {/* Rotating rings */}
          {[300, 250, 200].map((size, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: size, height: size,
              border: `1px solid ${["rgba(245,158,11,0.35)", "rgba(139,92,246,0.45)", "rgba(96,165,250,0.35)"][i]}`,
              animation: `spin-ring ${[12, 8, 5.5][i]}s linear infinite ${i % 2 === 1 ? "reverse" : ""}`,
            }} />
          ))}
          {/* Diamond */}
          <div className="absolute" style={{ width: 220, height: 220, animation: "spin-ring 22s linear infinite" }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,4 96,50 50,96 4,50" fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="0.6" />
              {([[50, 4], [96, 50], [50, 96], [4, 50]] as [number, number][]).map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2.5" fill="#f59e0b" opacity="0.8" />
              ))}
              <polygon points="50,20 80,50 50,80 20,50" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="0.4" />
            </svg>
          </div>
          {/* Core orb */}
          <div className="relative rounded-full flex items-center justify-center" style={{
            width: 170, height: 170,
            background: "radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(139,92,246,0.4) 48%, transparent 72%)",
            animation: `pulse-orb ${isCharging ? "0.6" : "2.5"}s ease-in-out infinite`,
            boxShadow: "0 0 100px 35px rgba(245,158,11,0.22), 0 0 200px 70px rgba(139,92,246,0.13)",
          }}>
            <div className="rounded-full" style={{
              width: 84, height: 84,
              background: "radial-gradient(circle, #fff 0%, #fbbf24 35%, #a78bfa 65%, transparent 100%)",
              boxShadow: "0 0 45px 18px rgba(255,255,255,0.55)",
              animation: `pulse-orb ${isCharging ? "0.45" : "1.8"}s ease-in-out infinite`,
            }} />
          </div>
        </div>

        {/* WISH BUTTON */}
        {phase === "idle" && (
          <button onClick={handleWish} className="relative group" style={{ animation: "float-btn 3s ease-in-out infinite" }}>
            <div className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", filter: "blur(16px)", transform: "scale(1.2)", animation: "glow-btn 2s ease-in-out infinite" }} />
            <div className="relative flex items-center gap-4 px-16 py-5 rounded-full font-black text-sm uppercase tracking-[0.35em] border group-hover:scale-105 group-active:scale-95 transition-transform duration-200"
              style={{
                background: "linear-gradient(135deg,#fde68a 0%,#fbbf24 40%,#f59e0b 70%,#d97706 100%)",
                borderColor: "rgba(255,255,255,0.5)", color: "#1a0533",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 30px rgba(245,158,11,0.5)",
              }}>
              <span style={{ fontSize: 22, animation: "sparkle-spin 4s linear infinite" }}>✦</span>
              Lakukan Wish
              <span style={{ fontSize: 22, animation: "sparkle-spin 4s linear infinite reverse" }}>✦</span>
            </div>
            {/* Loading indicator under button */}
            {!videoReady && (
              <p className="text-center mt-3 text-[10px] text-amber-400/50 font-bold uppercase tracking-widest animate-pulse">
                Memuat portal...
              </p>
            )}
          </button>
        )}

        {/* Charging state */}
        {isCharging && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-amber-300 font-black text-xl uppercase tracking-[0.4em] animate-pulse">
              Membuka Portal...
            </p>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400"
                  style={{ animation: `bounce-dot 0.7s ${i * 0.14}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-orb { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.14);opacity:1} }
        @keyframes float-btn { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow-btn { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes bounce-dot { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-12px);opacity:1} }
        @keyframes sparkle-spin { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.4)} 100%{transform:rotate(360deg) scale(1)} }
      `}</style>
    </div>
  );
}
