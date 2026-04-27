"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight, Search, X, BookOpen, Flame, Star } from "lucide-react";
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

type Props = {
  posts: Post[];
  featured: Post | null;
  popular: Post[];
};

// ── Small reusable post card ──────────────────────────────────────────────────
function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  return (
    <Link
      href={`/artikel/${post.slug}`}
      className="group flex flex-col bg-white rounded-[28px] overflow-hidden border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.12)]"
    >
      <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
        {post.mainImage ? (
          <Image
            fill
            src={urlForImage(post.mainImage).width(700).height(450).url()}
            alt={post.title}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen size={36} />
          </div>
        )}
        {post.categoryTitle && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-primary shadow-sm">
            {post.categoryTitle}
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar size={11} />
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
              : "Draft"}
          </span>
          {post.authorName && (
            <>
              <span className="text-slate-200">·</span>
              <span className="flex items-center gap-1.5">
                <User size={11} />
                {post.authorName}
              </span>
            </>
          )}
        </div>
        <h3 className="text-lg font-black text-primary mb-2 tracking-tight leading-snug group-hover:text-brand transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-1.5 text-brand font-bold text-xs">
          Baca <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

// ── Main client component ─────────────────────────────────────────────────────
export default function ArtikelClient({ posts, featured, popular }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(posts.map((p) => p.categoryTitle).filter(Boolean)));
    return ["Semua", ...cats];
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchQ =
        query.trim() === "" ||
        post.title?.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(query.toLowerCase()) ||
        post.authorName?.toLowerCase().includes(query.toLowerCase());
      const matchCat = activeCategory === "Semua" || post.categoryTitle === activeCategory;
      return matchQ && matchCat;
    });
  }, [posts, query, activeCategory]);

  // When search/filter is active, hide featured/popular and show flat grid
  const isFiltering = query.trim() !== "" || activeCategory !== "Semua";
  const hasSidebar = popular.length > 0 && !isFiltering;

  return (
    <>
      {/* ── Featured Hero ── shown only when not filtering */}
      {featured && !isFiltering && (
        <Link
          href={`/artikel/${featured.slug}`}
          className="group relative flex flex-col md:flex-row rounded-[24px] overflow-hidden bg-white mb-10 transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.08)] hover:-translate-y-1"
        >
          {/* Image */}
          <div className="relative w-full md:w-[60%] h-64 md:h-auto min-h-[320px] bg-slate-100 overflow-hidden shrink-0 rounded-[24px]">
            {featured.mainImage ? (
              <Image
                fill
                src={urlForImage(featured.mainImage).width(1200).height(800).url()}
                alt={featured.title}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <BookOpen size={48} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />
            
             <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex gap-2 z-10">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                    <Star size={12} className="fill-brand text-brand" />
                    Utama
                 </div>
                 {featured.categoryTitle && (
                    <div className="px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                    {featured.categoryTitle}
                    </div>
                )}
             </div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 md:w-[40%]">
            <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight leading-tight mb-4 group-hover:text-brand transition-colors line-clamp-3 md:line-clamp-4">
              {featured.title}
            </h2>

            {featured.excerpt && (
              <p className="text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2 md:line-clamp-3 text-sm">
                {featured.excerpt}
              </p>
            )}

            <div className="mt-auto">
               <div className="flex items-center gap-3 mb-4">
                  {featured.authorName && (
                    <span className="text-xs font-bold text-slate-700">
                     {featured.authorName}
                    </span>
                  )}
                  {featured.authorName && featured.publishedAt && <span className="text-slate-300">•</span>}
                  {featured.publishedAt && (
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(featured.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
               </div>

                <div className="inline-flex items-center gap-2 font-black text-xs text-brand uppercase tracking-widest">
                Baca Artikel
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── Search + Filter ── */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-lg">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, penulis, atau topik…"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1">
              <X size={15} />
            </button>
          )}
        </div>

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

        {isFiltering && (
          <p className="text-xs text-slate-400 font-medium">
            Menampilkan <span className="text-brand font-bold">{filtered.length}</span> dari {posts.length} artikel
          </p>
        )}
      </div>

      {/* ── Content area: grid + sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

        {/* Grid */}
        <div className="flex-1 min-w-0 max-w-full">
          {filtered.length > 0 ? (
            <div className={`grid gap-5 ${hasSidebar ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {filtered.map((post, i) => (
                <PostCard key={post.slug || i} post={post} priority={i < 2} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[28px] border border-slate-100">
              <Search size={36} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Tidak ada artikel yang cocok.</p>
              <button
                onClick={() => { setQuery(""); setActiveCategory("Semua"); }}
                className="mt-4 text-brand text-sm font-bold hover:underline"
              >
                Reset pencarian
              </button>
            </div>
          )}
        </div>

        {/* Sidebar — Pilihan Editor */}
        {popular.length > 0 && !isFiltering && (
          <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0">
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 lg:sticky lg:top-28">
              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <Flame size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rekomendasi</p>
                  <h3 className="text-sm font-black text-primary leading-none">Pilihan Editor</h3>
                </div>
              </div>

              {/* Popular list */}
              <div className="space-y-0 divide-y divide-slate-50">
                {popular.map((post, i) => (
                  <Link
                    key={post.slug || i}
                    href={`/artikel/${post.slug}`}
                    className="group flex items-start gap-3 py-4 first:pt-0 last:pb-0 transition-colors"
                  >
                    {/* Rank number */}
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5 ${
                      i === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400"
                    }`}>
                      {i + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {post.mainImage ? (
                        <Image
                          fill
                          src={urlForImage(post.mainImage).width(120).height(100).url()}
                          alt={post.title}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen size={16} />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-primary leading-snug group-hover:text-brand transition-colors line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                          : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
