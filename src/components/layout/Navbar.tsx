"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Beranda", href: "/" },
  { name: "Artikel", href: "/artikel" },
  { name: "Program", href: "/#program" },
  { name: "Tentang", href: "/#tentang" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Throttled scroll handler — prevents jank
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  // Active link: exact match for real pages, ignore hash-only anchors
  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false; // anchor links never "active"
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 will-change-transform",
          isScrolled
            ? "bg-white/90 backdrop-blur-md py-2 shadow-sm border-b border-slate-100"
            : "bg-transparent py-5"
        )}
      >
        <div className="section-container flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center p-1 transition-all duration-200 group-hover:shadow-md">
              <Image
                src="/logo.png"
                alt="DPN Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                Part of Duta Persada Nusantara
              </span>
              <span className={cn(
                "font-bold text-[14px] leading-none uppercase tracking-tight transition-colors",
                isScrolled ? "text-primary" : "text-primary"
              )}>
                Pemuda Pendidikan
              </span>
              <span className="text-accent text-[10px] font-black tracking-[0.25em] mt-0.5 uppercase">
                Nusantara
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const active = isActiveLink(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "relative text-[13px] font-semibold uppercase tracking-wider pb-1 transition-colors duration-200",
                      active
                        ? "text-brand"
                        : "text-slate-600 hover:text-brand"
                    )}
                  >
                    {link.name}
                    {/* Active underline */}
                    <span
                      className={cn(
                        "absolute bottom-0 left-0 h-0.5 bg-brand rounded-full transition-all duration-300",
                        active ? "w-full" : "w-0 group-hover:w-full"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
            <Link
              href="/#gabung"
              className="bg-brand text-white px-6 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-brand/90 hover:shadow-md active:scale-95"
            >
              Lihat Jadwal
            </Link>
          </div>

          {/* Burger Button */}
          <button
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMobileMenuOpen}
            className={cn(
              "md:hidden relative z-50 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200",
              isMobileMenuOpen
                ? "bg-brand text-white"
                : isScrolled
                  ? "text-primary hover:bg-slate-100"
                  : "text-primary hover:bg-white/20"
            )}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span
              className={cn(
                "absolute transition-all duration-200",
                isMobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
              )}
            >
              <X size={20} />
            </span>
            <span
              className={cn(
                "absolute transition-all duration-200",
                isMobileMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
              )}
            >
              <Menu size={20} />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-40 md:hidden h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center gap-3 px-6 pt-20 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center p-1">
            <Image src="/logo.png" alt="DPN Logo" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary leading-none">Pemuda Pendidikan</p>
            <p className="text-[9px] font-bold text-accent uppercase tracking-[0.2em] mt-0.5">Nusantara</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col px-4 py-6 gap-1 flex-1">
          {navLinks.map((link, i) => {
            const active = isActiveLink(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 40 + 80}ms` : "0ms" }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold transition-all duration-200",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-slate-700 hover:bg-slate-50 hover:text-brand"
                )}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* CTA at bottom */}
        <div className="px-4 pb-8">
          <Link
            href="/#gabung"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block w-full bg-brand text-white text-center py-4 rounded-2xl font-bold uppercase tracking-widest shadow-md transition-all hover:bg-brand/90 active:scale-95"
          >
            Lihat Jadwal
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
