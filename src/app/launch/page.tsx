"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SoundEngine } from "./SoundEngine";

type Phase = "idle"|"charging"|"rolling"|"flash"|"reveal"|"exit";
type Particle={x:number;y:number;vx:number;vy:number;size:number;opacity:number;color:string;life:number;maxLife:number};
type SStar={x:number;y:number;vx:number;vy:number;len:number;opacity:number;life:number;maxLife:number};
const C=["#f1c873","#ffffff","#a78bfa","#60a5fa","#fbbf24","#34d399","#f472b6"];

export default function LaunchPage(){
  const router=useRouter();
  const cvs=useRef<HTMLCanvasElement>(null);
  const particles=useRef<Particle[]>([]);
  const sstars=useRef<SStar[]>([]);
  const snd=useRef(new SoundEngine());
  const stopDrone=useRef<(()=>void)|null>(null);
  const [phase,setPhase]=useState<Phase>("idle");
  const [stars]=useState(()=>Array.from({length:220},(_,i)=>({
    id:i,x:Math.random()*100,y:Math.random()*100,
    size:Math.random()*2.5+0.4,op:Math.random()*0.7+0.2,
    dur:Math.random()*3+2,del:Math.random()*8
  })));
  const [revStars,setRevStars]=useState(0);
  const [shake,setShake]=useState(false);
  const [lightning,setLightning]=useState(false);

  const spawn=useCallback((x:number,y:number,n:number,burst=false)=>{
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+Math.random()*0.5;
      const sp=burst?Math.random()*25+10:Math.random()*1.5+0.3;
      particles.current.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
        size:Math.random()*(burst?7:2)+1,opacity:1,
        color:C[Math.floor(Math.random()*C.length)],life:0,maxLife:burst?100:150});
    }
  },[]);

  const spawnSS=useCallback((canvas:HTMLCanvasElement)=>{
    const sp=Math.random()*35+22;
    const side=Math.floor(Math.random()*3); // 0=right, 1=top, 2=diagonal
    const y=side===1?-20:Math.random()*canvas.height;
    const x=side===0?canvas.width+120:Math.random()*canvas.width;
    sstars.current.push({
      x,y,vx:side===1?(Math.random()-0.5)*10:-sp,
      vy:side===1?sp:(Math.random()-0.5)*8,
      len:Math.random()*320+150,opacity:1,life:0,
      maxLife:Math.floor(Math.max(canvas.width,canvas.height)/sp)+20
    });
  },[]);

  useEffect(()=>{
    const canvas=cvs.current; if(!canvas)return;
    const ctx=canvas.getContext("2d"); if(!ctx)return;
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    let frame=0,raf:number;

    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      frame++;
      const cx=canvas.width/2,cy=canvas.height/2;

      if(phase==="idle"&&frame%10===0) spawn(cx+(Math.random()-.5)*220,cy+(Math.random()-.5)*220,2);
      if(phase==="charging"&&frame%3===0) spawn(cx,cy,8);

      if(phase==="rolling"){
        // Dense shooting stars from multiple angles
        if(frame%4===0) spawnSS(canvas);
        // Also spawn some from center outward (reverse warp)
        if(frame%6===0) spawn(cx+(Math.random()-.5)*40,cy+(Math.random()-.5)*40,4);

        // Warp tunnel rings expanding from center
        for(let r=0;r<10;r++){
          const progress=((frame*1.8+r*18)%120)/120;
          const radius=progress*Math.max(canvas.width,canvas.height)*0.85;
          const op=(1-progress)*0.55;
          const hue=((frame*2+r*36)%360);
          ctx.strokeStyle=`hsla(${hue},90%,70%,${op})`;
          ctx.lineWidth=1.5+op*3;
          ctx.shadowColor=`hsla(${hue},100%,80%,0.8)`;
          ctx.shadowBlur=12;
          ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.stroke();
        }
        ctx.shadowBlur=0;

        // Radial speed lines (hyperspace warp)
        for(let i=0;i<24;i++){
          const angle=(i/24)*Math.PI*2;
          const f1=((frame*3)%80)/80;
          const f2=((frame*3+40)%80)/80;
          const r1=30+f1*Math.max(canvas.width,canvas.height)*0.7;
          const r2=30+f2*Math.max(canvas.width,canvas.height)*0.7;
          const color=i%3===0?"rgba(245,158,11,":i%3===1?"rgba(139,92,246,":"rgba(96,165,250,";
          ctx.strokeStyle=`${color}${(1-f1)*0.5})`;
          ctx.lineWidth=1.5;
          ctx.beginPath();
          ctx.moveTo(cx+Math.cos(angle)*r1,cy+Math.sin(angle)*r1);
          ctx.lineTo(cx+Math.cos(angle)*r2,cy+Math.sin(angle)*r2);
          ctx.stroke();
        }

        // Pulsing center portal
        const pulseR=60+Math.sin(frame*0.15)*20;
        const pg=ctx.createRadialGradient(cx,cy,0,cx,cy,pulseR);
        pg.addColorStop(0,"rgba(255,255,255,0.25)");
        pg.addColorStop(0.5,"rgba(245,158,11,0.15)");
        pg.addColorStop(1,"transparent");
        ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(cx,cy,pulseR,0,Math.PI*2); ctx.fill();

        // Outer nebula wave
        const ngr=ctx.createRadialGradient(cx,cy,200,cx,cy,600+Math.sin(frame*0.08)*100);
        ngr.addColorStop(0,"rgba(139,92,246,0.06)");
        ngr.addColorStop(0.5,"rgba(245,158,11,0.04)");
        ngr.addColorStop(1,"transparent");
        ctx.fillStyle=ngr; ctx.fillRect(0,0,canvas.width,canvas.height);
      }

      // Shooting stars
      sstars.current=sstars.current.filter(s=>s.life<s.maxLife&&s.x>-s.len&&s.y<canvas.height+50);
      for(const s of sstars.current){
        s.x+=s.vx; s.y+=s.vy; s.life++;
        s.opacity=Math.max(0,1-s.life/s.maxLife);
        const angle=Math.atan2(s.vy,s.vx);
        const gx=s.x+Math.cos(angle)*s.len, gy=s.y+Math.sin(angle)*s.len;
        const g=ctx.createLinearGradient(s.x,s.y,gx,gy);
        g.addColorStop(0,"rgba(255,255,255,0)");
        g.addColorStop(0.5,`rgba(210,210,255,${s.opacity*0.4})`);
        g.addColorStop(1,`rgba(255,255,255,${s.opacity})`);
        ctx.save(); ctx.strokeStyle=g; ctx.lineWidth=1.5+s.opacity;
        ctx.shadowColor="rgba(200,220,255,0.9)"; ctx.shadowBlur=12;
        ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(gx,gy); ctx.stroke();
        ctx.fillStyle=`rgba(255,255,255,${s.opacity})`;
        ctx.shadowBlur=25; ctx.beginPath(); ctx.arc(s.x,s.y,2.5,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // Particles
      particles.current=particles.current.filter(p=>p.life<p.maxLife);
      for(const p of particles.current){
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.93; p.vy*=0.93; p.life++;
        p.opacity=1-p.life/p.maxLife;
        ctx.save(); ctx.globalAlpha=p.opacity; ctx.fillStyle=p.color;
        ctx.shadowColor=p.color; ctx.shadowBlur=p.size*6;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{window.removeEventListener("resize",resize);cancelAnimationFrame(raf);};
  },[phase,spawn,spawnSS]);

  const handleWish=useCallback(()=>{
    if(phase!=="idle")return;
    const s=snd.current; s.init(); s.playClick();
    const cx=window.innerWidth/2,cy=window.innerHeight/2;

    // Charging
    setTimeout(()=>{setPhase("charging"); s.playCharge();},100);

    // Rolling — 4.5 seconds of hyperspace!
    setTimeout(()=>{
      setPhase("rolling");
      stopDrone.current=s.playRollingDrone();
      // Staggered whooshes throughout the roll
      [0,300,600,900,1200,1500,1800,2100,2400,2700,3000,3300,3600].forEach((d,i)=>{
        setTimeout(()=>{
          s.playWhoosh(0.8+Math.random()*0.6);
          if(i%3===0) s.playMysticCrack();
          // Lightning flash every ~600ms
          if(i%2===0){ setLightning(true); setTimeout(()=>setLightning(false),80); }
        },d);
      });
    },2600);

    // Flash/impact
    setTimeout(()=>{
      if(stopDrone.current){stopDrone.current();stopDrone.current=null;}
      setPhase("flash"); spawn(cx,cy,600,true);
      setShake(true); s.playImpact();
      setTimeout(()=>setShake(false),700);
    },7200);

    // Reveal
    setTimeout(()=>{
      setPhase("reveal"); s.playEpicFanfare();
      [0,1,2,3,4].forEach(i=>setTimeout(()=>{setRevStars(i+1);s.playStarBell(i);},i*250));
    },8000);

    // Exit
    setTimeout(()=>setPhase("exit"),12500);
    setTimeout(()=>router.push("/"),13500);
  },[phase,router,spawn]);

  const isRoll=phase==="rolling";
  const isReveal=phase==="reveal"||phase==="exit";
  const isFlash=phase==="flash";

  return(
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center select-none"
      style={{
        background:"radial-gradient(ellipse at 50% 40%, #1a0533 0%, #09000f 45%, #000008 100%)",
        animation:shake?"screen-shake 0.5s ease-in-out":"none"
      }}>
      <canvas ref={cvs} className="absolute inset-0 z-10 pointer-events-none"/>

      {/* Lightning overlay */}
      <div className="absolute inset-0 z-25 pointer-events-none transition-opacity duration-75"
        style={{background:"rgba(160,140,255,0.18)",opacity:lightning?1:0}}/>

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

      {/* Rolling: full overlay with color shift */}
      {isRoll&&(
        <div className="absolute inset-0 z-5 pointer-events-none"
          style={{background:"radial-gradient(ellipse at 50% 50%, rgba(80,0,120,0.4) 0%, rgba(0,0,20,0.7) 100%)",
            animation:"rolling-bg 0.8s ease-in-out infinite alternate"}}/>
      )}

      {/* Corner decorations */}
      {!isRoll&&!isReveal&&(
        <>{["top-0 left-0","top-0 right-0 [transform:scaleX(-1)]","bottom-0 left-0 [transform:scaleY(-1)]","bottom-0 right-0 [transform:scale(-1)]"].map((cls,i)=>(
          <div key={i} className={`absolute ${cls} w-36 h-36 z-20 pointer-events-none opacity-40`}>
            <svg viewBox="0 0 80 80" fill="none">
              <path d="M0 0 L38 0 L0 38 Z" stroke="#f59e0b" strokeWidth="0.8" fill="none" opacity="0.7"/>
              <path d="M0 0 L16 0 L0 16 Z" stroke="#a78bfa" strokeWidth="0.5" fill="rgba(167,139,250,0.1)"/>
              <circle cx="38" cy="0" r="3" fill="#f59e0b" opacity="0.8"/>
              <circle cx="0" cy="38" r="3" fill="#f59e0b" opacity="0.8"/>
            </svg>
          </div>
        ))}</>
      )}

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6">

        {/* Header */}
        <div className="mb-10 transition-all duration-500"
          style={{opacity:isRoll||isReveal?0:1,transform:isRoll?"translateY(-60px) scale(0.7)":"none"}}>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] mb-2" style={{color:"rgba(245,158,11,0.6)"}}>
            Part of Duta Persada Nusantara
          </p>
          <h2 className="text-xl font-black uppercase tracking-widest" style={{color:"rgba(255,255,255,0.1)"}}>
            Pemuda Pendidikan Nusantara
          </h2>
        </div>

        {/* ORB */}
        {!isRoll&&!isReveal&&(
          <div className="relative mb-14 flex items-center justify-center"
            style={{transition:"transform 0.5s ease",transform:phase==="charging"?"scale(1.8)":"scale(1)"}}>
            {[300,250,200].map((size,i)=>(
              <div key={i} className="absolute rounded-full" style={{
                width:size,height:size,
                border:`1px solid ${["rgba(245,158,11,0.35)","rgba(139,92,246,0.45)","rgba(96,165,250,0.35)"][i]}`,
                animation:`spin-ring ${[12,8,5.5][i]}s linear infinite ${i%2===1?"reverse":""}`
              }}/>
            ))}
            <div className="absolute" style={{width:220,height:220,animation:"spin-ring 22s linear infinite"}}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,4 96,50 50,96 4,50" fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="0.6"/>
                {([[50,4],[96,50],[50,96],[4,50]] as [number,number][]).map(([cx,cy],i)=>(
                  <circle key={i} cx={cx} cy={cy} r="2.5" fill="#f59e0b" opacity="0.8"/>
                ))}
                <polygon points="50,20 80,50 50,80 20,50" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="0.4"/>
              </svg>
            </div>
            <div className="relative rounded-full flex items-center justify-center" style={{
              width:170,height:170,
              background:"radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(139,92,246,0.4) 48%, transparent 72%)",
              animation:`pulse-orb ${phase==="charging"?"0.65":"2.5"}s ease-in-out infinite`,
              boxShadow:"0 0 100px 35px rgba(245,158,11,0.22), 0 0 200px 70px rgba(139,92,246,0.13)",
            }}>
              <div className="rounded-full" style={{
                width:84,height:84,
                background:"radial-gradient(circle, #fff 0%, #fbbf24 35%, #a78bfa 65%, transparent 100%)",
                boxShadow:"0 0 45px 18px rgba(255,255,255,0.55)",
                animation:`pulse-orb ${phase==="charging"?"0.5":"1.8"}s ease-in-out infinite`
              }}/>
            </div>
          </div>
        )}

        {/* IDLE button */}
        {phase==="idle"&&(
          <button onClick={handleWish} className="relative group" style={{animation:"float-btn 3s ease-in-out infinite"}}>
            <div className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
              style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",filter:"blur(16px)",transform:"scale(1.2)",animation:"glow-btn 2s ease-in-out infinite"}}/>
            <div className="relative flex items-center gap-4 px-16 py-5 rounded-full font-black text-sm uppercase tracking-[0.35em] border group-hover:scale-105 group-active:scale-95 transition-transform duration-200"
              style={{background:"linear-gradient(135deg,#fde68a 0%,#fbbf24 40%,#f59e0b 70%,#d97706 100%)",
                borderColor:"rgba(255,255,255,0.5)",color:"#1a0533",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 30px rgba(245,158,11,0.5)"}}>
              <span style={{fontSize:22,animation:"sparkle-spin 4s linear infinite"}}>✦</span>
              Lakukan Wish
              <span style={{fontSize:22,animation:"sparkle-spin 4s linear infinite reverse"}}>✦</span>
            </div>
          </button>
        )}

        {/* Charging */}
        {phase==="charging"&&(
          <div className="flex flex-col items-center gap-4">
            <p className="text-amber-300 font-black text-xl uppercase tracking-[0.4em] animate-pulse">Membuka Portal...</p>
            <div className="flex gap-2">{[0,1,2,3,4].map(i=>(
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400"
                style={{animation:`bounce-dot 0.7s ${i*0.14}s ease-in-out infinite`}}/>
            ))}</div>
          </div>
        )}

        {/* Rolling */}
        {isRoll&&(
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {[1,0.7,0.4].map((op,i)=>(
                <div key={i} className="absolute rounded-full border-2 border-amber-400"
                  style={{width:40+i*28,height:40+i*28,opacity:op,
                    animation:`spin-ring ${[0.6,0.9,1.3][i]}s linear infinite ${i%2===1?"reverse":""}`}}/>
              ))}
              <div className="w-8 h-8 rounded-full bg-white" style={{boxShadow:"0 0 30px 10px rgba(245,158,11,0.9)"}}/>
            </div>
            <p className="text-purple-300 font-black text-sm uppercase tracking-[0.5em]"
              style={{animation:"rolling-text 0.3s ease-in-out infinite alternate"}}>
              ⚡ Melintas Dimensi Nusantara ⚡
            </p>
          </div>
        )}

        {/* Reveal */}
        {isReveal&&(
          <div className="flex flex-col items-center relative" style={{animation:"reveal-in 0.9s cubic-bezier(0.22,1,0.36,1) forwards"}}>
            {/* Sun rays */}
            <div className="absolute pointer-events-none" style={{width:"120vw",height:"120vw",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"rays-spin 10s linear infinite",opacity:0.7}}>
              {Array.from({length:20}).map((_,i)=>(
                <div key={i} className="absolute left-1/2 bottom-1/2 origin-bottom"
                  style={{width:2,height:"60vh",
                    background:`linear-gradient(to top, ${i%2===0?"rgba(245,158,11,0.5)":"rgba(139,92,246,0.4)"}, transparent)`,
                    transform:`translateX(-50%) rotate(${i*18}deg)`,transformOrigin:"50% 100%"}}/>
              ))}
            </div>
            {/* Logo */}
            <div className="relative z-10 w-32 h-32 rounded-[32px] bg-white flex items-center justify-center mb-5"
              style={{boxShadow:"0 0 120px 50px rgba(245,158,11,0.6), 0 0 0 6px rgba(245,158,11,0.3)",animation:"logo-float 3s ease-in-out infinite"}}>
              <Image src="/logo.png" alt="PPN" width={96} height={96} className="object-contain"/>
            </div>
            {/* Stars */}
            <div className="flex gap-2 mb-5">
              {[0,1,2,3,4].map(i=>(
                <span key={i} style={{color:"#fbbf24",fontSize:28,
                  opacity:revStars>i?1:0.1,
                  transform:revStars>i?"scale(1.2)":"scale(0.4)",
                  transition:"all 0.35s cubic-bezier(0.22,1,0.36,1)",
                  textShadow:revStars>i?"0 0 25px rgba(245,158,11,1)":"none",
                  filter:revStars>i?"drop-shadow(0 0 8px #fbbf24)":"none"
                }}>★</span>
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-1"
              style={{textShadow:"0 0 60px rgba(245,158,11,0.9), 0 0 20px rgba(255,255,255,0.5)"}}>
              Pemuda Pendidikan
            </h1>
            <h1 className="text-4xl md:text-6xl font-black leading-none mb-3"
              style={{color:"#fbbf24",textShadow:"0 0 50px rgba(245,158,11,0.8)"}}>
              Nusantara
            </h1>
            <p className="text-amber-300/70 font-bold tracking-[0.4em] text-xs uppercase">✦ Website Resmi Telah Hadir ✦</p>
          </div>
        )}
      </div>

      {/* Flash */}
      <div className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-200"
        style={{background:"white",opacity:isFlash?1:0}}/>
      {/* Exit */}
      <div className="absolute inset-0 z-40 pointer-events-none transition-opacity duration-1000"
        style={{background:"#000008",opacity:phase==="exit"?1:0}}/>

      <style>{`
        @keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        @keyframes spin-ring{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse-orb{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.14);opacity:1}}
        @keyframes float-btn{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow-btn{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes bounce-dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-12px);opacity:1}}
        @keyframes sparkle-spin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.4)}100%{transform:rotate(360deg) scale(1)}}
        @keyframes rolling-bg{from{opacity:.7}to{opacity:1}}
        @keyframes rolling-text{from{opacity:.6;color:#c4b5fd}to{opacity:1;color:#fde68a}}
        @keyframes reveal-in{from{opacity:0;transform:scale(.65) translateY(40px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes rays-spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes logo-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.04)}}
        @keyframes screen-shake{
          0%{transform:translate(0)}10%{transform:translate(-7px,5px)}20%{transform:translate(7px,-5px)}
          30%{transform:translate(-5px,7px)}40%{transform:translate(5px,-7px)}50%{transform:translate(-7px,3px)}
          60%{transform:translate(7px,-3px)}70%{transform:translate(-3px,5px)}80%{transform:translate(3px,-5px)}
          90%{transform:translate(-2px,2px)}100%{transform:translate(0)}}
      `}</style>
    </div>
  );
}
