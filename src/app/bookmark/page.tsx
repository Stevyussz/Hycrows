"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BookmarkItem } from "@/app/artikel/[slug]/BookmarkButton";
import { ArrowRight, Bookmark, Calendar, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("dpn_bookmarks");
    if (stored) {
      setBookmarks(JSON.parse(stored));
    }
  }, []);

  const removeBookmark = (slug: string) => {
    const updated = bookmarks.filter((b) => b.slug !== slug);
    setBookmarks(updated);
    localStorage.setItem("dpn_bookmarks", JSON.stringify(updated));
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#f8fafc] pt-20 pb-2">
        <Navbar />
      </div>

      <section className="section-padding pt-10 min-h-[70vh]">
        <div className="section-container max-w-5xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                Koleksi Pribadi
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                Baca <span className="text-brand">Nanti.</span>
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
              <Bookmark size={16} className="text-brand fill-brand" />
              {bookmarks.length} Artikel
            </div>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-[32px] border border-slate-100 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)]">
              <Bookmark size={48} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black text-primary mb-2">Belum ada artikel yang disimpan</h3>
              <p className="text-slate-400 font-medium mb-6">Mulai jelajahi jurnal kami dan simpan artikel favoritmu untuk dibaca nanti.</p>
              <Link 
                href="/artikel" 
                className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:bg-brand-dark transition-all hover:scale-105"
              >
                Jelajahi Artikel
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              <AnimatePresence>
                {bookmarks.map((post) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={post.slug}
                    className="group flex flex-col bg-white rounded-[28px] overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.12)]"
                  >
                    <div className="p-6 flex flex-col flex-grow relative">
                      {/* Remove Button */}
                      <button 
                        onClick={(e) => { e.preventDefault(); removeBookmark(post.slug); }}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors z-10"
                        title="Hapus bookmark"
                      >
                        <Bookmark size={14} className="fill-current" />
                      </button>

                      {post.categoryTitle && (
                        <div className="inline-block bg-accent/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-primary self-start mb-4">
                          {post.categoryTitle}
                        </div>
                      )}
                      
                      <Link href={`/artikel/${post.slug}`} className="block mb-2 pr-10">
                        <h3 className="text-lg font-black text-primary tracking-tight leading-snug group-hover:text-brand transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      {post.excerpt && (
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={11} />
                            {new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-slate-200">·</span>
                          <span className="flex items-center gap-1.5 truncate max-w-[100px]">
                            <User size={11} />
                            {post.authorName}
                          </span>
                        </div>
                        
                        <Link href={`/artikel/${post.slug}`} className="flex items-center gap-1.5 text-brand font-bold text-xs">
                          Baca <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
