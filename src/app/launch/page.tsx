"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SoundEngine } from "./SoundEngine";

type Phase = "idle" | "charging" | "rolling" | "flash" | "reveal" | "exit";
type Particle = { x:number;y:number;vx:number;vy:number;size:number;opacity:number;color:string;life:number;maxLife:number };
type SStar = { x:number;y:number;vx:number;vy:number;len:number;opacity:number;life:number;maxLife:number };
const C = ["#f1c873","#ffffff","#a78bfa","#60a5fa","#fbbf24","#34d399"];

export default function LaunchPage() {
  const router = useRouter();
  const cvs = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const sstars = useRef<SStar[]>([]);
  const snd = useRef(new SoundEngine());
  const [phase, setPhase] = useState<Phase>("idle");
  const [stars] = useState(() => Array.from({length:200},(_,i)=>({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:Math.random()*2.5+0.4, op:Math.random()*0.7+0.2,
    dur:Math.random()*3+2, del:Math.random()*8
  })));
  const [revStars, setRevStars] = useState(0);
  const [shake, setShake] = useState(false);

  const spawn = useCallback((x:number,y:number,n:number,burst=false)=>{
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+Math.random()*0.5;
      const sp=burst?Math.random()*22+8:Math.random()*1.5+0.3;
      particles.current.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
        size:Math.random()*(burst?6:2)+1,opacity:1,
        color:C[Math.floor(Math.random()*C.length)],life:0,maxLife:burst?80:140});
    }
  },[]);

  const spawnSS = useCallback((canvas:HTMLCanvasElement)=>{
    const sp=Math.random()*28+18;
    sstars.current.push({
      x:canvas.width+120, y:Math.random()*canvas.height,
      vx:-sp, vy:(Math.random()-0.5)*6,
      len:Math.random()*250+120, opacity:1, life:0,
      maxLife:Math.floor(canvas.width/sp)+15
    });
  },[]);

  useEffect(()=>{
    const canvas=cvs.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    let frame=0, raf:number;
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      frame++;
      const cx=canvas.width/2, cy=canvas.height/2;
      if(phase==="idle"&&frame%10===0) spawn(cx+(Math.random()-.5)*220,cy+(Math.random()-.5)*220,2);
      if(phase==="charging"&&frame%3===0) spawn(cx,cy,7);
      if(phase==="rolling"&&frame%6===0) spawnSS(canvas);
      // rolling vortex center glow
      if(phase==="rolling"){
        const r=ctx.createRadialGradient(cx,cy,0,cx,cy,200+Math.sin(frame*0.1)*30);
        r.addColorStop(0,"rgba(245,158,11,0.15)");
        r.addColorStop(0.5,"rgba(139,92,246,0.1)");
        r.addColorStop(1,"transparent");
        ctx.fillStyle=r; ctx.fillRect(0,0,canvas.width,canvas.height);
      }
      // shooting stars
      sstars.current=sstars.current.filter(s=>s.life<s.maxLife&&s.x>-s.len);
      for(const s of sstars.current){
        s.x+=s.vx; s.y+=s.vy; s.life++;
        s.opacity=Math.max(0,1-s.life/s.maxLife);
        const g=ctx.createLinearGradient(s.x,s.y,s.x+s.len,s.y);
        g.addColorStop(0,"rgba(255,255,255,0)");
        g.addColorStop(0.6,`rgba(200,200,255,${s.opacity*0.5})`);
        g.addColorStop(1,`rgba(255,255,255,${s.opacity})`);
        ctx.save(); ctx.strokeStyle=g; ctx.lineWidth=1.5+Math.random();
        ctx.shadowColor="rgba(200,200,255,0.9)"; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x+s.len,s.y); ctx.stroke();
        ctx.fillStyle=`rgba(255,255,255,${s.opacity})`; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.arc(s.x,s.y,2,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // particles
      particles.current=particles.current.filter(p=>p.life<p.maxLife);
      for(const p of particles.current){
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.93; p.vy*=0.93; p.life++;
        p.opacity=1-p.life/p.maxLife;
        ctx.save(); ctx.globalAlpha=p.opacity; ctx.fillStyle=p.color;
        ctx.shadowColor=p.color; ctx.shadowBlur=p.size*5;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{window.removeEventListener("resize",resize);cancelAnimationFrame(raf);};
  },[phase,spawn,spawnSS]);

  const handleWish = useCallback(()=>{
    if(phase!=="idle") return;
    const s=snd.current; s.init(); s.playClick();
    const cx=window.innerWidth/2, cy=window.innerHeight/2;
    setTimeout(()=>{ setPhase("charging"); s.playCharge(); },100);
    setTimeout(()=>{ setPhase("rolling"); [0,250,500,750,1000,1250,1500].forEach(d=>setTimeout(()=>s.playWhoosh(),d)); },2200);
    setTimeout(()=>{
      setPhase("flash"); spawn(cx,cy,500,true); setShake(true);
      s.playImpact(); setTimeout(()=>setShake(false),600);
    },4000);
    setTimeout(()=>{
      setPhase("reveal"); s.playFanfare();
      [0,1,2,3,4].forEach(i=>setTimeout(()=>{ setRevStars(i+1); s.playStarBell(i); },i*220));
    },4700);
    setTimeout(()=>setPhase("exit"),8200);
    setTimeout(()=>router.push("/"),9000);
  },[phase,router,spawn]);

  const isRoll=phase==="rolling";
  const isReveal=phase==="reveal"||phase==="exit";
  const isFlash=phase==="flash";

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center select-none"
      style={{
        background:"radial-gradient(ellipse at 50% 40%, #1a0533 0%, #09000f 45%, #000008 100%)",
        animation:shake?"screen-shake 0.5s ease-in-out":"none"
      }}>
      <canvas ref={cvs} className="absolute inset-0 z-10 pointer-events-none"/>

      {/* Stars */}
      <div className="absolute inset-0 z-0">
        {stars.map(s=>(
          <div key={s.id} className="absolute rounded-full bg-white"
            style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,opacity:s.op,
              animation:`twinkle ${s.dur}s ${s.del}s infinite ease-in-out`}}/>
        ))}
      </div>

      {/* Nebula */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{background:`
        radial-gradient(ellipse 60% 45% at 20% 30%, rgba(139,92,246,0.2) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 70%, rgba(59,130,246,0.15) 0%, transparent 60%),
        radial-gradient(ellipse 70% 55% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)`}}/>

      {/* Rolling speed-lines overlay */}
      {isRoll&&(
        <div className="absolute inset-0 z-15 pointer-events-none" style={{
          background:"radial-gradient(ellipse 15% 15% at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          animation:"rolling-pulse 0.4s ease-in-out infinite alternate"
        }}/>
      )}

      {/* Corner decorations */}
      {!isRoll&&!isReveal&&(
        <>
          {[
            "top-0 left-0",
            "top-0 right-0 [transform:scaleX(-1)]",
            "bottom-0 left-0 [transform:scaleY(-1)]",
            "bottom-0 right-0 [transform:scale(-1)]"
          ].map((cls,i)=>(
            <div key={i} className={`absolute ${cls} w-36 h-36 z-20 pointer-events-none opacity-40`}>
              <svg viewBox="0 0 80 80" fill="none">
                <path d="M0 0 L38 0 L0 38 Z" stroke="#f59e0b" strokeWidth="0.8" fill="none" opacity="0.7"/>
                <path d="M0 0 L16 0 L0 16 Z" stroke="#a78bfa" strokeWidth="0.5" fill="rgba(167,139,250,0.1)"/>
                <circle cx="38" cy="0" r="3" fill="#f59e0b" opacity="0.8"/>
                <circle cx="0" cy="38" r="3" fill="#f59e0b" opacity="0.8"/>
              </svg>
            </div>
          ))}
        </>
      )}

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6">

        {/* Header */}
        <div className="mb-10 transition-all duration-500"
          style={{opacity:isRoll||isReveal?0:1,transform:isRoll?"translateY(-50px) scale(0.8)":"none"}}>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] mb-2" style={{color:"rgba(245,158,11,0.6)"}}>
            Part of Duta Persada Nusantara
          </p>
          <h2 className="text-xl font-black uppercase tracking-widest" style={{color:"rgba(255,255,255,0.1)"}}>
            Pemuda Pendidikan Nusantara
          </h2>
        </div>

        {/* ORB (hidden while rolling/reveal) */}
        {!isRoll&&!isReveal&&(
          <div className="relative mb-14 flex items-center justify-center"
            style={{transition:"transform 0.5s ease",transform:phase==="charging"?"scale(1.7)":"scale(1)"}}>
            {[290,240,190].map((size,i)=>(
              <div key={i} className="absolute rounded-full" style={{
                width:size,height:size,
                border:`1px solid ${["rgba(245,158,11,0.3)","rgba(139,92,246,0.4)","rgba(96,165,250,0.3)"][i]}`,
                animation:`spin-ring ${[11,7.5,5][i]}s linear infinite ${i%2===1?"reverse":""}`
              }}/>
            ))}
            <div className="absolute" style={{width:210,height:210,animation:"spin-ring 20s linear infinite"}}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,4 96,50 50,96 4,50" fill="none" stroke="rgba(245,158,11,0.22)" strokeWidth="0.6"/>
                {[[50,4],[96,50],[50,96],[4,50]].map(([cx,cy],i)=>(
                  <circle key={i} cx={cx} cy={cy} r="2.5" fill="#f59e0b" opacity="0.7"/>
                ))}
              </svg>
            </div>
            <div className="relative rounded-full flex items-center justify-center" style={{
              width:165,height:165,
              background:"radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(139,92,246,0.38) 48%, transparent 72%)",
              animation:`pulse-orb ${phase==="charging"?"0.7":"2.5"}s ease-in-out infinite`,
              boxShadow:"0 0 90px 30px rgba(245,158,11,0.2), 0 0 180px 60px rgba(139,92,246,0.12)",
            }}>
              <div className="rounded-full" style={{
                width:82,height:82,
                background:"radial-gradient(circle, #fff 0%, #fbbf24 35%, #a78bfa 65%, transparent 100%)",
                boxShadow:"0 0 40px 15px rgba(255,255,255,0.5)",
                animation:`pulse-orb ${phase==="charging"?"0.5":"1.8"}s ease-in-out infinite`
              }}/>
            </div>
          </div>
        )}

        {/* WISH BUTTON */}
        {phase==="idle"&&(
          <button onClick={handleWish} className="relative group" style={{animation:"float-btn 3s ease-in-out infinite"}}>
            <div className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
              style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",filter:"blur(14px)",transform:"scale(1.18)",animation:"glow-btn 2s ease-in-out infinite"}}/>
            <div className="relative flex items-center gap-4 px-16 py-5 rounded-full font-black text-sm uppercase tracking-[0.35em] border transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
              style={{
                background:"linear-gradient(135deg,#fde68a 0%,#fbbf24 40%,#f59e0b 70%,#d97706 100%)",
                borderColor:"rgba(255,255,255,0.5)",color:"#1a0533",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 30px rgba(245,158,11,0.5)"
              }}>
              <span className="text-2xl" style={{animation:"sparkle-spin 4s linear infinite"}}>✦</span>
              Lakukan Wish
              <span className="text-2xl" style={{animation:"sparkle-spin 4s linear infinite reverse"}}>✦</span>
            </div>
          </button>
        )}

        {/* CHARGING text */}
        {phase==="charging"&&(
          <div className="flex flex-col items-center gap-4">
            <p className="text-amber-300 font-black text-lg uppercase tracking-[0.4em] animate-pulse">Membuka Portal...</p>
            <div className="flex gap-2">
              {[0,1,2,3,4].map(i=>(
                <div key={i} className="w-2 h-2 rounded-full bg-amber-400"
                  style={{animation:`bounce-dot 0.7s ${i*0.14}s ease-in-out infinite`}}/>
              ))}
            </div>
          </div>
        )}

        {/* ROLLING text */}
        {isRoll&&(
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl" style={{animation:"spin-fast 0.4s linear infinite"}}>✦</div>
            <p className="text-white/60 font-bold text-sm uppercase tracking-[0.5em] animate-pulse">Melintas Portal Nusantara...</p>
          </div>
        )}

        {/* REVEAL */}
        {isReveal&&(
          <div className="flex flex-col items-center relative" style={{animation:"reveal-in 0.9s cubic-bezier(0.22,1,0.36,1) forwards"}}>
            {/* Gold sun rays */}
            <div className="absolute pointer-events-none" style={{width:"100vw",height:"100vw",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"rays-spin 8s linear infinite",opacity:0.6}}>
              {Array.from({length:16}).map((_,i)=>(
                <div key={i} className="absolute left-1/2 bottom-1/2 origin-bottom"
                  style={{width:2,height:"55vh",background:"linear-gradient(to top, rgba(245,158,11,0.5), transparent)",
                    transform:`translateX(-50%) rotate(${i*22.5}deg)`,transformOrigin:"50% 100%"}}/>
              ))}
            </div>
            {/* Logo */}
            <div className="relative z-10 w-32 h-32 rounded-[32px] bg-white flex items-center justify-center mb-6"
              style={{boxShadow:"0 0 100px 40px rgba(245,158,11,0.55), 0 0 0 5px rgba(245,158,11,0.25)",animation:"logo-float 3s ease-in-out infinite"}}>
              <Image src="/logo.png" alt="PPN" width={96} height={96} className="object-contain"/>
            </div>
            {/* Stars */}
            <div className="flex gap-1.5 mb-5">
              {[0,1,2,3,4].map(i=>(
                <span key={i} style={{
                  color:"#fbbf24",fontSize:26,
                  opacity:revStars>i?1:0.1,
                  transform:revStars>i?"scale(1)":"scale(0.5)",
                  transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)",
                  textShadow:revStars>i?"0 0 20px rgba(245,158,11,0.8)":"none"
                }}>★</span>
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-1"
              style={{textShadow:"0 0 60px rgba(245,158,11,0.9), 0 0 20px rgba(255,255,255,0.5)"}}>
              Pemuda
            </h1>
            <h1 className="text-5xl md:text-7xl font-black leading-none mb-2"
              style={{color:"#fbbf24",textShadow:"0 0 50px rgba(245,158,11,0.8)"}}>
              Pendidikan
            </h1>
            <h2 className="text-3xl md:text-4xl font-black text-white/80 mb-6 tracking-widest uppercase">Nusantara</h2>
            <p className="text-amber-300/70 font-bold tracking-[0.4em] text-xs uppercase">✦ Website Resmi Telah Hadir ✦</p>
          </div>
        )}
      </div>

      {/* Flash */}
      <div className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300"
        style={{background:"white",opacity:isFlash?1:0}}/>
      {/* Exit fade */}
      <div className="absolute inset-0 z-40 pointer-events-none transition-opacity duration-800"
        style={{background:"#000008",opacity:phase==="exit"?1:0}}/>

      <style>{`
        @keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        @keyframes spin-ring{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse-orb{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.13);opacity:1}}
        @keyframes float-btn{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow-btn{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes bounce-dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-10px);opacity:1}}
        @keyframes reveal-in{from{opacity:0;transform:scale(.7) translateY(30px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes rays-spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes logo-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes sparkle-spin{from{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.3)}to{transform:rotate(360deg) scale(1)}}
        @keyframes spin-fast{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rolling-pulse{from{opacity:.3}to{opacity:1}}
        @keyframes screen-shake{
          0%{transform:translate(0,0)}10%{transform:translate(-6px,4px)}20%{transform:translate(6px,-4px)}
          30%{transform:translate(-4px,6px)}40%{transform:translate(4px,-6px)}50%{transform:translate(-6px,2px)}
          60%{transform:translate(6px,-2px)}70%{transform:translate(-2px,4px)}80%{transform:translate(2px,-4px)}
          90%{transform:translate(-2px,2px)}100%{transform:translate(0,0)}}
      `}</style>
    </div>
  );
}
