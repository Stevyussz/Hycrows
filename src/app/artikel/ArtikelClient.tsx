"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight, Search, X, BookOpen } from "lucide-react";
import { urlForImage } from "@/sanity/lib/image";

type Post = {
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string;
  mainImage: any;
  authorName: string;
  categoryTitle: string;
};

export default function ArtikelClient({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  // Collect unique categories
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(posts.map((p) => p.categoryTitle).filter(Boolean))
    );
    return ["Semua", ...cats];
  }, [posts]);

  // Filter articles based on search + category
  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchQuery =
        query.trim() === "" ||
        post.title?.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(query.toLowerCase()) ||
        post.authorName?.toLowerCase().includes(query.toLowerCase());

      const matchCategory =
        activeCategory === "Semua" || post.categoryTitle === activeCategory;

      return matchQuery && matchCategory;
    });
  }, [posts, query, activeCategory]);

  return (
    <>
      {/* ── Search + Filter Bar ── */}
      <div className="mb-12 space-y-5">
        {/* Search Input */}
        <div className="relative max-w-lg">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, penulis, atau topik…"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-brand text-white border-brand shadow-md"
                    : "bg-white text-slate-500 border-slate-200 hover:border-brand hover:text-brand"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {(query || activeCategory !== "Semua") && (
          <p className="text-xs text-slate-400 font-medium">
            Menampilkan{" "}
            <span className="text-brand font-bold">{filtered.length}</span>{" "}
            dari {posts.length} artikel
          </p>
        )}
      </div>

      {/* ── Article Grid ── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length > 0 ? (
          filtered.map((article, i) => (
            <Link
              href={`/artikel/${article.slug}`}
              key={article.slug || i}
              className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)]"
            >
              <div className="w-full h-56 relative overflow-hidden bg-slate-100">
                {article.mainImage ? (
                  <Image
                    fill
                    src={urlForImage(article.mainImage).width(700).height(450).url()}
                    alt={article.title}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <BookOpen size={40} />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-primary shadow-sm">
                  {article.categoryTitle || "Umum"}
                </div>
              </div>

              <div className="p-7 flex flex-col flex-grow">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Draft"}
                  </span>
                  <span className="text-slate-200">·</span>
                  <span className="flex items-center gap-1.5">
                    <User size={13} />
                    {article.authorName || "Tim PPN"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-primary mb-3 tracking-tight leading-snug group-hover:text-brand transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 flex-grow line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-center text-primary group-hover:text-brand font-bold text-sm transition-colors">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight
                    size={16}
                    className="-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                  />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <Search size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium text-lg">
              Tidak ada artikel yang cocok.
            </p>
            <button
              onClick={() => { setQuery(""); setActiveCategory("Semua"); }}
              className="mt-4 text-brand text-sm font-bold hover:underline"
            >
              Reset pencarian
            </button>
          </div>
        )}
      </div>
    </>
  );
}
