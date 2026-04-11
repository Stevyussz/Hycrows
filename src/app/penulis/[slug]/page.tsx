import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PortableText } from "@portabletext/react";
import { ArrowLeft, ArrowRight, Calendar, PenLine, BookOpen } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const AUTHOR_QUERY = `*[_type == "author" && slug.current == $slug][0] {
  name,
  role,
  image,
  bio,
  "slug": slug.current,
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc) {
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    mainImage,
    "categoryTitle": categories[0]->title
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

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#f8fafc] pt-24 pb-4">
        <Navbar />
      </div>

      {/* ── Hero Profile Banner ── */}
      <section className="relative overflow-hidden pb-0">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] -ml-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] -mr-32 -mb-32 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 pt-10 pb-16 relative z-10">
          <Link
            href="/artikel"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-brand transition-colors mb-10"
          >
            <ArrowLeft size={16} /> Kembali ke Jurnal
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_80px_-20px_rgba(30,58,138,0.12)] overflow-hidden">
            {/* Top Banner */}
            <div className="h-40 bg-gradient-to-r from-brand via-brand/90 to-accent/70 relative">
              <div className="absolute inset-0 opacity-10"
                style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
            </div>

            {/* Profile Info */}
            <div className="px-8 md:px-12 pb-10">
              {/* Avatar — overlapping the banner */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-16 mb-8">
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-[28px] border-4 border-white shadow-xl overflow-hidden bg-slate-200 shrink-0">
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
                <div className="flex gap-6 md:gap-10 mb-2">
                  <div className="text-center">
                    <p className="text-3xl font-black text-brand leading-none">{postCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Artikel</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-brand leading-none">
                      {postCount > 0
                        ? new Date(author.posts[0].publishedAt).getFullYear()
                        : new Date().getFullYear()}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Bergabung</p>
                  </div>
                </div>
              </div>

              {/* Name & Role */}
              <div className="mb-6">
                <div className="inline-block bg-accent px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                  {author.role || "Kontributor"}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">{author.name}</h1>
              </div>

              {/* Bio */}
              {author.bio && (
                <div className="prose prose-slate max-w-2xl text-slate-500 font-medium leading-relaxed">
                  <PortableText value={author.bio} />
                </div>
              )}
              {!author.bio && (
                <p className="text-slate-400 font-medium italic">Penulis belum menambahkan bio.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Articles by Author ── */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
              <PenLine size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Karya</p>
              <h2 className="text-2xl font-black text-primary tracking-tight">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {author.posts.map((post: any, i: number) => (
                <Link
                  key={i}
                  href={`/artikel/${post.slug}`}
                  className="group bg-white rounded-[28px] border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)]"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
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
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      <Calendar size={12} />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Draft"}
                    </div>
                    <h3 className="text-lg font-black text-primary tracking-tight leading-snug mb-3 group-hover:text-brand transition-colors line-clamp-2">
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
