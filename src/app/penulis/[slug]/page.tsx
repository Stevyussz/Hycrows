import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PortableText } from "@portabletext/react";
import { ArrowLeft, ArrowRight, Calendar, PenLine, BookOpen, Instagram, Twitter, Linkedin, Youtube, Globe, Quote, Tags, Milestone } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const AUTHOR_QUERY = `*[_type == "author" && slug.current == $slug][0] {
  name,
  role,
  image,
  bio,
  socialMedia,
  quote,
  expertise,
  "slug": slug.current,
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc) {
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    mainImage,
    "categoryTitle": categories[0]->title,
    "plainText": pt::text(body)
  }
}`;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const author = await client.fetch(AUTHOR_QUERY, { slug });

  if (!author) return { title: "Penulis tidak ditemukan | PPN" };

  return {
    title: `${author.name} | Penulis PPN`,
    description: `Profil dan karya-karya ${author.name} di Pemuda Pendidikan Nusantara.`,
    openGraph: {
      title: `${author.name} — Penulis Pemuda Pendidikan Nusantara`,
      description: author.role || "Kontributor Pemuda Pendidikan Nusantara",
      images: author.image ? [{ url: urlForImage(author.image).width(800).height(800).url() }] : [],
    },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await client.fetch(AUTHOR_QUERY, { slug });

  if (!author) notFound();

  const postCount = author.posts?.length || 0;
  
  // Calculate dynamic stats
  let totalWords = 0;
  let categoryCounts: Record<string, number> = {};
  
  if (author.posts) {
    author.posts.forEach((post: any) => {
      if (post.plainText) {
        totalWords += post.plainText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      }
      if (post.categoryTitle) {
        categoryCounts[post.categoryTitle] = (categoryCounts[post.categoryTitle] || 0) + 1;
      }
    });
  }
  
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const sm = author.socialMedia || {};

  const socialLinks = [
    { href: sm.instagram, icon: Instagram, label: "Instagram", color: "hover:bg-[#E1306C] hover:border-[#E1306C]" },
    { href: sm.twitter, icon: Twitter, label: "Twitter / X", color: "hover:bg-[#1DA1F2] hover:border-[#1DA1F2]" },
    { href: sm.linkedin, icon: Linkedin, label: "LinkedIn", color: "hover:bg-[#0A66C2] hover:border-[#0A66C2]" },
    { href: sm.youtube, icon: Youtube, label: "YouTube", color: "hover:bg-[#FF0000] hover:border-[#FF0000]" },
    { href: sm.website, icon: Globe, label: "Website", color: "hover:bg-brand hover:border-brand" },
  ].filter((s) => !!s.href);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#f8fafc] pt-20 pb-2">
        <Navbar />
      </div>

      {/* ── Hero Profile Banner ── */}
      <section className="relative overflow-hidden pb-0">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] -ml-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] -mr-32 -mb-32 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-5 sm:px-6 pt-8 pb-12 relative z-10">
          <Link
            href="/artikel"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-brand transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Kembali ke Jurnal
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-[0_20px_80px_-20px_rgba(30,58,138,0.12)] overflow-hidden">
            {/* Top Banner */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-brand via-brand/90 to-accent/70 relative">
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
              />
            </div>

            {/* Profile Info */}
            <div className="px-5 sm:px-8 md:px-12 pb-8 sm:pb-10">
              {/* Avatar + Stats Row */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-16 mb-6 sm:mb-8">
                {/* Avatar */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-[20px] sm:rounded-[28px] border-4 border-white shadow-xl overflow-hidden bg-slate-200 shrink-0">
                  {author.image ? (
                    <Image
                      src={urlForImage(author.image).width(288).height(288).url()}
                      alt={author.name}
                      fill
                      className="object-cover"
                      sizes="144px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-400">
                      {author.name?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap sm:flex-nowrap gap-5 sm:gap-8 mb-1">
                  <div className="text-center sm:text-left">
                    <p className="text-2xl sm:text-3xl font-black text-brand leading-none">{postCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Artikel</p>
                  </div>
                  <div className="w-px bg-slate-100 hidden sm:block" />
                  <div className="text-center sm:text-left">
                    <p className="text-2xl sm:text-3xl font-black text-accent leading-none">
                      {Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(totalWords)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Kata</p>
                  </div>
                  <div className="w-px bg-slate-100 hidden sm:block" />
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-xl font-black text-primary leading-none max-w-[120px] truncate" title={topCategory}>
                      {topCategory}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Top Kategori</p>
                  </div>
                </div>
              </div>

              {/* Name & Role */}
              <div className="mb-6">
                <div className="inline-block bg-accent px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                  {author.role || "Kontributor"}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tight">{author.name}</h1>
              </div>
              
              {/* Quote section */}
              {author.quote && (
                <div className="relative bg-brand/5 border border-brand/10 p-5 rounded-2xl mb-8">
                  <Quote size={24} className="text-brand/30 absolute top-4 right-5" />
                  <p className="text-lg text-primary/80 font-medium italic relative z-10 pl-2 border-l-2 border-accent">
                    "{author.quote}"
                  </p>
                </div>
              )}

              {/* Bio */}
              {author.bio ? (
                <div className="prose prose-slate max-w-2xl text-slate-500 font-medium leading-relaxed text-sm sm:text-base mb-8">
                  <PortableText value={author.bio} />
                </div>
              ) : (
                <p className="text-slate-400 font-medium italic mb-8">Penulis belum menambahkan bio.</p>
              )}
              
              {/* Expertise Tags */}
              {author.expertise && author.expertise.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Tags size={14} className="text-slate-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Keahlian & Fokus</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {author.expertise.map((tag: string, index: number) => (
                      <span key={index} className="bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1 rounded-lg font-semibold tracking-wide shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.label}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:text-white hover:-translate-y-0.5 hover:shadow-md ${social.color}`}
                    >
                      <social.icon size={15} />
                      <span className="hidden sm:inline">{social.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Articles by Author ── */}
      <section className="pb-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-8 sm:mb-10">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <PenLine size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Karya</p>
              <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                Artikel oleh {author.name.split(" ")[0]}
              </h2>
            </div>
          </div>

          {postCount === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
              <BookOpen size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Penulis ini belum menerbitkan artikel.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {author.posts.map((post: any, i: number) => (
                <Link
                  key={i}
                  href={`/artikel/${post.slug}`}
                  className="group bg-white rounded-[24px] sm:rounded-[28px] border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)]"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden">
                    {post.mainImage ? (
                      <Image
                        src={urlForImage(post.mainImage).width(600).height(400).url()}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen size={32} />
                      </div>
                    )}
                    {post.categoryTitle && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                        {post.categoryTitle}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      <Calendar size={12} />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Draft"}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-primary tracking-tight leading-snug mb-3 group-hover:text-brand transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-brand font-bold text-sm">
                      Baca
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
