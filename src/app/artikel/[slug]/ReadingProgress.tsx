"use client";

import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export default function ReadingProgress() {
  const progressValue = useMotionValue(0);
  const scaleX = useSpring(progressValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      const article = document.getElementById("article-content");
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much is scrollable
      // We want progress to start when the top of the article hits the middle of the screen
      // and end when the bottom of the article hits the bottom of the screen.
      // But a simpler approach:
      // Start: top of article hits top of viewport (rect.top <= 0)
      // End: bottom of article hits bottom of viewport (rect.bottom <= windowHeight)
      
      const totalScrollDistance = rect.height - windowHeight;
      if (totalScrollDistance <= 0) {
        progressValue.set(1);
        return;
      }

      let progress = -rect.top / totalScrollDistance;
      progress = Math.max(0, Math.min(1, progress));
      
      progressValue.set(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll); // Recalculate on resize
    
    // Initial calculation after a slight delay to ensure DOM is fully painted
    setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [progressValue]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-brand transform origin-left z-[9999]"
      style={{ scaleX }}
    />
  );
}
