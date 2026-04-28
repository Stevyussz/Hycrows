"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  const mouseX = useRef(0);
  const mouseY = useRef(0);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    // Only show custom cursor on devices that support hover (desktops)
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    
    if (mediaQuery.matches) {
      setIsVisible(true);
      document.body.style.cursor = "none"; // Hide default cursor globally
      
      const moveCursor = (e: MouseEvent) => {
        mouseX.current = e.clientX;
        mouseY.current = e.clientY;
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      };

      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isClickable = 
          target.tagName.toLowerCase() === "a" ||
          target.tagName.toLowerCase() === "button" ||
          target.closest("a") ||
          target.closest("button") ||
          target.classList.contains("cursor-pointer") ||
          getComputedStyle(target).cursor === "pointer";
          
        setIsHovering(!!isClickable);
      };

      window.addEventListener("mousemove", moveCursor);
      window.addEventListener("mouseover", handleMouseOver);
      
      // Cleanup
      return () => {
        document.body.style.cursor = "auto";
        window.removeEventListener("mousemove", moveCursor);
        window.removeEventListener("mouseover", handleMouseOver);
      };
    }
  }, [cursorX, cursorY, pathname]); // Re-run effect slightly on path change to catch new DOM elements if needed

  if (!isVisible) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-brand/50 pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-brand pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 3.5 : 1,
          backgroundColor: isHovering ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 1)",
          backdropFilter: isHovering ? "blur(2px)" : "none",
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
