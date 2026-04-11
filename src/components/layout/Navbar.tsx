"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Artikel", href: "/artikel" },
    { name: "Program", href: "#program" },
    { name: "Tentang", href: "#tentang" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled 
          ? "glass py-2 shadow-premium" 
          : "bg-transparent py-6"
      )}
    >
      <div className="section-container flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center p-1.5 transition-premium group-hover:shadow-md">
            <Image
              src="/logo.png"
              alt="DPN Logo"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
              Part of Duta Persada Nusantara
            </span>
            <span className={cn(
              "font-bold text-[15px] leading-none uppercase tracking-tight transition-colors",
              isScrolled ? "text-primary" : "text-primary dark:text-white"
            )}>
              Pemuda Pendidikan
            </span>
            <span className="text-accent text-[10px] font-black tracking-[0.25em] mt-1 uppercase">
              Nusantara
            </span>
          </div>
        </Link>



        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (pathname === "/" && link.href.startsWith("#"));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "relative text-[13px] font-semibold uppercase tracking-wider transition-premium group/link",
                    isActive 
                      ? "text-brand" 
                      : isScrolled 
                        ? "text-primary/70 hover:text-brand" 
                        : "text-primary/70 dark:text-white/70 hover:text-brand dark:hover:text-white"
                  )}
                >
                  {link.name}
                  {isActive && (
                    <motion.span 
                      layoutId="activeNav"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand/40 rounded-full transition-all group-hover/link:w-full" />
                  )}
                </Link>
              );
            })}
          </div>
          <Link
            href="#gabung"
            className="bg-primary text-white px-7 py-3 rounded-full text-[13px] font-bold uppercase tracking-widest transition-premium hover:bg-primary-light hover:shadow-premium active:scale-95"
          >
            Lihat Jadwal
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={cn(
            "md:hidden p-2 rounded-lg transition-colors",
            isScrolled ? "text-primary hover:bg-slate-100" : "text-primary dark:text-white hover:bg-white/10"
          )}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass absolute top-full left-0 right-0 py-8 px-6 flex flex-col gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (pathname === "/" && link.href.startsWith("#"));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 text-lg font-bold transition-all",
                  isActive 
                    ? "text-brand translate-x-1" 
                    : "text-primary dark:text-white hover:text-brand"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand" />}
                {link.name}
              </Link>
            );
          })}
          <Link
            href="#gabung"
            className="bg-primary text-white text-center py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg mt-4"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Jadi Relawan
          </Link>
        </div>
      )}
    </nav>
  );
};


export default Navbar;
