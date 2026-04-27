"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Phase = "idle" | "charging" | "flash" | "reveal" | "exit";
const COLORS = ["#f1c873", "#ffffff", "#a78bfa", "#60a5fa", "#fbbf24"];

type Star = { id: number; x: number; y: number; size: number; opacity: number; duration: number; delay: number };
type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string; life: number; maxLife: number };

export default function LaunchPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stars] = useState<Star[]>(() =>
    Array.from({ length: 180 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 6,
    }))
  );

  const spawnParticles = useCallback((x: number, y: number, count: number, burst = false) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = burst ? Math.random() * 18 + 6 : Math.random() * 1.5 + 0.3;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (burst ? 5 : 2) + 1,
        opacity: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0,
        maxLife: burst ? 70 : 130,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    let frame = 0;
    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      if (phase === "idle" && frame % 10 === 0) {
        spawnParticles(canvas.width / 2 + (Math.random() - 0.5) * 220, canvas.height / 2 + (Math.random() - 0.5) * 220, 3);
      }
      if (phase === "charging" && frame % 4 === 0) {
        spawnParticles(canvas.width / 2, canvas.height / 2, 8);
      }
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life++;
        p.opacity = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafId); };
  }, [phase, spawnParticles]);

  const handleWish = useCallback(() => {
    if (phase !== "idle") return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setPhase("charging");
    setTimeout(() => {
      setPhase("flash");
      spawnParticles(cx, cy, 300, true);
    }, 2000);
    setTimeout(() => setPhase("reveal"), 2600);
    setTimeout(() => setPhase("exit"), 5500);
    setTimeout(() => router.push("/"), 6200);
  }, [phase, router, spawnParticles]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center select-none"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #160428 0%, #08000f 45%, #000005 100%)" }}>

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Stars */}
      <div className="absolute inset-0 z-0">
        {stars.map(s => (
          <div key={s.id} className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: s.opacity, animation: `twinkle ${s.duration}s ${s.delay}s infinite ease-in-out` }} />
        ))}
      </div>

      {/* Nebula glow */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 55% 40% at 20% 30%, rgba(139,92,246,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 45% 35% at 80% 65%, rgba(59,130,246,0.14) 0%, transparent 60%),
          radial-gradient(ellipse 65% 50% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)`
      }} />

      {/* Corner decorations */}
      {["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 left-0 -rotate-90", "bottom-0 right-0 rotate-180"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-32 h-32 z-20 pointer-events-none`} style={{ opacity: 0.4 }}>
          <svg viewBox="0 0 80 80" fill="none">
            <path d="M0 0 L30 0 L0 30 Z" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M0 0 L15 0 L0 15 Z" stroke="#a78bfa" strokeWidth="0.5" fill="rgba(167,139,250,0.1)" />
            <circle cx="30" cy="0" r="2" fill="#f59e0b" opacity="0.8" />
            <circle cx="0" cy="30" r="2" fill="#f59e0b" opacity="0.8" />
          </svg>
        </div>
      ))}

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6">

        {/* Header text — hide on reveal */}
        <div className="mb-10 transition-all duration-500" style={{ opacity: phase === "reveal" || phase === "exit" ? 0 : 1 }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] mb-2" style={{ color: "rgba(245,158,11,0.6)" }}>
            Part of Duta Persada Nusantara
          </p>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.1)" }}>
            Pemuda Pendidikan Nusantara
          </h2>
        </div>

        {/* Orb */}
        <div className="relative mb-14 flex items-center justify-center"
          style={{ transition: "transform 0.6s ease", transform: phase === "charging" ? "scale(1.5)" : phase === "flash" ? "scale(4)" : "scale(1)" }}>
          {/* Rotating rings */}
          {[260, 210, 170].map((size, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: size, height: size,
                border: `1px solid ${["rgba(245,158,11,0.25)", "rgba(139,92,246,0.35)", "rgba(96,165,250,0.3)"][i]}`,
                animation: `spin-ring ${[10, 7, 5][i]}s linear infinite ${i % 2 === 1 ? "reverse" : ""}`,
              }} />
          ))}
          {/* Diamond shape overlay */}
          <div className="absolute" style={{ width: 180, height: 180, animation: "spin-ring 20s linear infinite" }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="0.5" />
              <circle cx="50" cy="5" r="2" fill="#f59e0b" opacity="0.6" />
              <circle cx="95" cy="50" r="2" fill="#f59e0b" opacity="0.6" />
              <circle cx="50" cy="95" r="2" fill="#f59e0b" opacity="0.6" />
              <circle cx="5" cy="50" r="2" fill="#f59e0b" opacity="0.6" />
            </svg>
          </div>
          {/* Glowing orb */}
          <div className="relative rounded-full flex items-center justify-center"
            style={{
              width: 150, height: 150,
              background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(139,92,246,0.35) 45%, transparent 70%)",
              animation: "pulse-orb 2.5s ease-in-out infinite",
              boxShadow: "0 0 80px 25px rgba(245,158,11,0.18), 0 0 150px 50px rgba(139,92,246,0.1)",
            }}>
            <div className="rounded-full"
              style={{
                width: 70, height: 70,
                background: "radial-gradient(circle, #ffffff 0%, #fbbf24 35%, #a78bfa 65%, transparent 100%)",
                boxShadow: "0 0 40px 12px rgba(255,255,255,0.5)",
                animation: "pulse-orb 1.8s ease-in-out infinite",
              }} />
          </div>
        </div>

        {/* WISH BUTTON */}
        {phase === "idle" && (
          <button onClick={handleWish} className="relative group" style={{ animation: "float-btn 3s ease-in-out infinite" }}>
            <div className="absolute inset-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", filter: "blur(12px)", transform: "scale(1.15)", animation: "glow-btn 2s ease-in-out infinite" }} />
            <div className="relative flex items-center gap-4 px-16 py-5 rounded-full font-black text-sm uppercase tracking-[0.35em] border transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
              style={{
                background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f59e0b 70%, #d97706 100%)",
                borderColor: "rgba(255,255,255,0.4)",
                color: "#1a0533",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 30px rgba(245,158,11,0.5)",
              }}>
              <span className="text-xl">✦</span>
              Lakukan Wish
              <span className="text-xl">✦</span>
            </div>
          </button>
        )}

        {/* Charging text */}
        {phase === "charging" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-amber-300 font-black text-lg uppercase tracking-[0.4em] animate-pulse">Membuka Portal...</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-amber-400"
                  style={{ animation: `bounce-dot 0.8s ${i * 0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* REVEAL */}
        {(phase === "reveal" || phase === "exit") && (
          <div className="flex flex-col items-center" style={{ animation: "reveal-in 0.9s cubic-bezier(0.22,1,0.36,1) forwards" }}>
            {/* Gold rays */}
            <div className="absolute inset-0 pointer-events-none" style={{ animation: "rays-spin 8s linear infinite" }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="absolute left-1/2 top-1/2 origin-bottom"
                  style={{
                    width: 2, height: "45vh",
                    background: "linear-gradient(to top, rgba(245,158,11,0.4), transparent)",
                    transform: `translateX(-50%) rotate(${i * 30}deg)`,
                    transformOrigin: "50% 100%",
                  }} />
              ))}
            </div>
            <div className="w-28 h-28 rounded-[28px] bg-white flex items-center justify-center mb-6 relative z-10"
              style={{ boxShadow: "0 0 80px 30px rgba(245,158,11,0.5), 0 0 0 4px rgba(245,158,11,0.3)" }}>
              <Image src="/logo.png" alt="PPN" width={88} height={88} className="object-contain" />
            </div>
            <div className="flex gap-1 mb-4">
              {[0,1,2,3,4].map(i => (
                <span key={i} style={{ color: "#fbbf24", fontSize: 22, animation: `star-pop 0.4s ${i*0.08}s both` }}>★</span>
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-1"
              style={{ textShadow: "0 0 60px rgba(245,158,11,0.9), 0 0 20px rgba(255,255,255,0.5)" }}>
              Pemuda
            </h1>
            <h1 className="text-5xl md:text-7xl font-black leading-none mb-2"
              style={{ color: "#fbbf24", textShadow: "0 0 50px rgba(245,158,11,0.8)" }}>
              Pendidikan
            </h1>
            <h2 className="text-3xl md:text-4xl font-black text-white/80 mb-6 tracking-widest uppercase">
              Nusantara
            </h2>
            <p className="text-amber-300/70 font-bold tracking-[0.4em] text-xs uppercase">
              ✦ Website Resmi Telah Hadir ✦
            </p>
          </div>
        )}
      </div>

      {/* Flash overlay */}
      <div className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300"
        style={{ background: "white", opacity: phase === "flash" ? 1 : 0 }} />

      {/* Exit fade */}
      <div className="absolute inset-0 z-40 pointer-events-none transition-opacity duration-700"
        style={{ background: "#000005", opacity: phase === "exit" ? 1 : 0 }} />

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-orb { 0%,100%{transform:scale(1);opacity:0.85} 50%{transform:scale(1.12);opacity:1} }
        @keyframes float-btn { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow-btn { 0%,100%{opacity:0.5} 50%{opacity:0.9} }
        @keyframes bounce-dot { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(-8px);opacity:1} }
        @keyframes reveal-in { from{opacity:0;transform:scale(0.7) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes star-pop { from{opacity:0;transform:scale(0) rotate(-180deg)} to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes rays-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
