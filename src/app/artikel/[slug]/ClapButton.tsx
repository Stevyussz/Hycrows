"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";

type ClapButtonProps = {
  postId: string;
  initialClaps: number;
  compact?: boolean;
};

export default function ClapButton({ postId, initialClaps, compact = false }: ClapButtonProps) {
  const [totalClaps, setTotalClaps] = useState(initialClaps || 0);
  const [userClaps, setUserClaps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // To show floating numbers "+1, +2"
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
  let clickIdCounter = useRef(0);
  
  // Debounce API call
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user's local claps from localStorage so they know if they already clapped
  useEffect(() => {
    const stored = localStorage.getItem(`claps_${postId}`);
    if (stored) {
      setUserClaps(parseInt(stored, 10));
    }
  }, [postId]);

  const handleClap = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Max 50 claps per user per post (Medium style)
    if (userClaps >= 50) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Increment local state
    const newTotal = totalClaps + 1;
    const newUserClaps = userClaps + 1;
    
    setTotalClaps(newTotal);
    setUserClaps(newUserClaps);
    setIsAnimating(true);
    
    // Save to local storage
    localStorage.setItem(`claps_${postId}`, newUserClaps.toString());

    // Add floating number
    const newClick = { id: clickIdCounter.current++, x, y };
    setClicks((prev) => [...prev, newClick]);

    // Remove floating number after animation
    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      setIsAnimating(false);
    }, 1000);

    // Debounce API call to save to Sanity
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      // Send the accumulated claps to the server
      // Note: In a real robust system, we would track exact delta, but here we 
      // just increment by 1 for every click via the state tracking.
      // Wait, if we send "clapsToAdd" as the delta since last API call...
      // For simplicity, we can just assume each debounced call sends the delta.
      // But we need to track delta since last save.
    }, 1000);
  };

  // We need a ref to track unsaved claps to send them safely
  const unsavedClaps = useRef(0);

  const handleClapWithDelta = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (userClaps >= 50) return;

    const rect = e.currentTarget.getBoundingClientRect();
    
    // Randomize slightly around the click center
    const x = (e.clientX - rect.left) + (Math.random() * 20 - 10);
    const y = (e.clientY - rect.top) + (Math.random() * 20 - 10);

    const newUserClaps = userClaps + 1;
    setTotalClaps((prev) => prev + 1);
    setUserClaps(newUserClaps);
    setIsAnimating(true);
    unsavedClaps.current += 1;
    
    localStorage.setItem(`claps_${postId}`, newUserClaps.toString());

    const newClick = { id: clickIdCounter.current++, x, y };
    setClicks((prev) => [...prev, newClick]);

    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      setIsAnimating(false);
    }, 1000);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (unsavedClaps.current === 0) return;
      
      const clapsToSend = unsavedClaps.current;
      unsavedClaps.current = 0; // Reset immediately to capture new clicks

      try {
        await fetch("/api/claps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, clapsToAdd: clapsToSend }),
        });
      } catch (err) {
        console.error("Failed to sync claps");
      }
    }, 1500); // 1.5s delay after last click
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <button
          onClick={handleClapWithDelta}
          disabled={userClaps >= 50}
          className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 ${
            userClaps > 0 
              ? "bg-brand border-brand text-white shadow-[0_4px_20px_-4px_rgba(245,158,11,0.5)]" 
              : "bg-white border-slate-200 text-slate-400 hover:border-brand hover:text-brand hover:shadow-sm"
          } ${userClaps >= 50 ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <motion.div
            animate={isAnimating ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Hand size={20} className={userClaps > 0 ? "fill-white" : ""} />
          </motion.div>
          
          {/* Small badge for compact mode */}
          {compact && totalClaps > 0 && (
            <div className="absolute -top-2 -right-2 bg-brand text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
              {totalClaps}
            </div>
          )}
        </button>

        {/* Floating Numbers (Explosion effect) */}
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: click.y - 20, x: click.x - 10, scale: 0.5, rotate: Math.random() * 40 - 20 }}
              animate={{ opacity: 0, y: click.y - 120, x: click.x + (Math.random() * 40 - 20), scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute pointer-events-none font-black text-brand text-xl z-20 drop-shadow-md"
            >
              +{userClaps}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Pulse Effect */}
        {isAnimating && (
          <motion.div
            className="absolute inset-0 rounded-full bg-brand/40 z-0"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.7 }}
          />
        )}
      </div>
      
      {!compact && (
        <div>
          <p className="text-sm font-black text-primary leading-none">
            {totalClaps.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Apresiasi
          </p>
        </div>
      )}
    </div>
  );
}
