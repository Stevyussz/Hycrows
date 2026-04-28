"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

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
      const elementTop = elementRect.top;
      const elementHeight = elementRect.height;
      
      // Start filling when article content hits the top of the screen (or 100px offset for navbar)
      const offset = 100;
      let p = 0;
      
      if (elementTop <= offset) {
        // Distance scrolled past the start of the article
        const scrollDistance = offset - elementTop; 
        
        // Total distance we can scroll before we hit the bottom of the article
        // We subtract the window height because we reach 100% when the *bottom* of the article 
        // hits the *bottom* of the screen.
        const maxScroll = elementHeight - windowHeight + offset;
        
        if (maxScroll > 0) {
           p = scrollDistance / maxScroll;
        } else {
           p = 1; // If article is very short, just fill it
        }
      }
      
      p = Math.max(0, Math.min(1, p));
      setProgress(p);
    };

    // Use passive listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial calculation
    handleScroll(); 
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand to-orange-400 transform origin-left z-[9999]"
      style={{ scaleX }}
    />
  );
}
