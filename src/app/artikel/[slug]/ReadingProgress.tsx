"use client";

import { useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function ReadingProgress() {
  const progress = useMotionValue(0);
  const scaleX = useSpring(progress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById("article-content");
      if (!element) return;
      
      const windowHeight = window.innerHeight;
      const elementRect = element.getBoundingClientRect();
      const elementHeight = elementRect.height;
      
      const offset = 100;
      let p = 0;
      
      if (elementRect.top <= offset) {
        const scrollDistance = offset - elementRect.top; 
        const maxScroll = elementHeight - windowHeight + offset;
        
        if (maxScroll > 0) {
           p = scrollDistance / maxScroll;
        } else {
           p = 1; 
        }
      }
      
      p = Math.max(0, Math.min(1, p));
      progress.set(p); // Set directly, no re-renders!
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll(); 
    
    // Watch for image loads that change the height
    const el = document.getElementById("article-content");
    let observer: ResizeObserver | null = null;
    if (el && window.ResizeObserver) {
      observer = new ResizeObserver(handleScroll);
      observer.observe(el);
    }
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (observer) observer.disconnect();
    };
  }, [progress]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand to-orange-400 origin-left z-[9999] pointer-events-none"
      style={{ scaleX }}
    />
  );
}
