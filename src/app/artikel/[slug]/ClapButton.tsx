"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

type ClapButtonProps = {
  postId: string;
  initialClaps: number;
};

// Random emojis for the festive burst
const EMOJIS = ["💖", "✨", "🔥", "🎉", "👏", "⭐"];

export default function ClapButton({ postId, initialClaps }: ClapButtonProps) {
  const [totalClaps, setTotalClaps] = useState(initialClaps || 0);
  const [userClaps, setUserClaps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFloating, setShowFloating] = useState(false);
  
  // Floating emojis instead of just numbers
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  let clickIdCounter = useRef(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsavedClaps = useRef(0);
  const inlineContainerRef = useRef<HTMLDivElement>(null);

  // Load user's local claps
  useEffect(() => {
    const stored = localStorage.getItem(`claps_${postId}`);
    if (stored) {
      setUserClaps(parseInt(stored, 10));
    }
  }, [postId]);

  // Scroll listener to show/hide floating button
  useEffect(() => {
    const handleScroll = () => {
      // Show floating button when user scrolls down 300px
      if (window.scrollY > 300) {
        // But hide it if they reach the bottom where the inline button is visible
        if (inlineContainerRef.current) {
          const rect = inlineContainerRef.current.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            setShowFloating(false); // Inline is visible
          } else {
            setShowFloating(true); // Inline is not visible
          }
        } else {
          setShowFloating(true);
        }
      } else {
        setShowFloating(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClap = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (userClaps >= 50) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) + (Math.random() * 40 - 20); // Wider random spread
    const y = (e.clientY - rect.top) + (Math.random() * 20 - 10);

    const newUserClaps = userClaps + 1;
    setTotalClaps((prev) => prev + 1);
    setUserClaps(newUserClaps);
    setIsAnimating(true);
    unsavedClaps.current += 1;
    
    localStorage.setItem(`claps_${postId}`, newUserClaps.toString());

    // Generate 2-3 random emojis per click for maximum wow factor
    const numEmojis = Math.floor(Math.random() * 2) + 2; 
    const newClicks = Array.from({ length: numEmojis }).map(() => ({
      id: clickIdCounter.current++,
      x: x + (Math.random() * 60 - 30),
      y: y + (Math.random() * 20 - 10),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    }));

    setClicks((prev) => [...prev, ...newClicks]);

    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => !newClicks.find(n => n.id === c.id)));
      setIsAnimating(false);
    }, 1200);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (unsavedClaps.current === 0) return;
      
      const clapsToSend = unsavedClaps.current;
      unsavedClaps.current = 0; 

      try {
        await fetch("/api/claps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, clapsToAdd: clapsToSend }),
        });
      } catch (err) {
        console.error("Failed to sync claps");
      }
    }, 1500);
  };

  const isMaxed = userClaps >= 50;

  // The actual interactive button component (reused for inline and floating)
  const renderInteractiveButton = (isFloating = false) => (
    <div className="relative">
      <button
        onClick={handleClap}
        disabled={isMaxed}
        className={`relative z-10 flex items-center justify-center transition-all duration-300 ${
          isFloating ? "w-14 h-14 shadow-[0_10px_30px_-5px_rgba(236,72,153,0.4)]" : "w-14 h-14"
        } rounded-full border-2 ${
          userClaps > 0 
            ? "bg-gradient-to-tr from-pink-500 to-rose-400 border-transparent text-white" 
            : "bg-white border-slate-200 text-slate-400 hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50"
        } ${isMaxed ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-110 active:scale-95"}`}
      >
        <motion.div
          animate={isAnimating ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Heart size={isFloating ? 26 : 24} className={userClaps > 0 ? "fill-white" : ""} />
        </motion.div>
        
        {/* Floating progress ring indicator */}
        {userClaps > 0 && !isMaxed && (
           <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="48" 
                fill="none" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="4" 
              />
              <circle 
                cx="50" cy="50" r="48" 
                fill="none" 
                stroke="white" 
                strokeWidth="4" 
                strokeDasharray="301.59" 
                strokeDashoffset={301.59 - (301.59 * (userClaps / 50))} 
                strokeLinecap="round"
                className="transition-all duration-300"
              />
           </svg>
        )}
      </button>

      {/* Burst Particles */}
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 1, y: click.y - 10, x: click.x - 20, scale: 0.5, rotate: Math.random() * 60 - 30 }}
            animate={{ 
              opacity: 0, 
              y: click.y - (Math.random() * 80 + 60), 
              x: click.x + (Math.random() * 60 - 30),
              scale: 1.5,
              rotate: Math.random() * 100 - 50
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute pointer-events-none text-2xl z-20"
            style={{ left: "50%", top: "50%" }}
          >
            {click.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Shockwave Effect */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-full bg-pink-400 z-0 pointer-events-none"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}
    </div>
  );

  return (
    <>
      {/* Inline Button (Inside CTA Block) */}
      <div className="flex items-center gap-4" ref={inlineContainerRef}>
        {renderInteractiveButton(false)}
        <div>
          <p className="text-xl font-black text-primary leading-none tracking-tight">
            {totalClaps.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Apresiasi
          </p>
        </div>
      </div>

      {/* Floating Button (Mudah Ditemukan) */}
      <AnimatePresence>
        {showFloating && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[9999] flex flex-col items-center gap-2"
          >
            {/* Show user's claps bubble if they clapped */}
            {userClaps > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-pink-500 font-black text-xs px-3 py-1 rounded-full shadow-md border border-pink-100"
              >
                {userClaps}/50
              </motion.div>
            )}
            {renderInteractiveButton(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
