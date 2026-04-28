import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import ShareButton from "./ShareButton";
import ReadingProgress from "./ReadingProgress";
import ClapButton from "./ClapButton";
import BookmarkButton from "./BookmarkButton";
import type { Metadata } from "next";

export const revalidate = 60;

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  title,
  publishedAt,
  mainImage,
  body,
  excerpt,
  claps,
  "_id": _id,
  "slug": slug.current,
  "authorName": author->name,
  "authorRole": author->role,
  "authorImage": author->image,
  "authorSlug": author->slug.current,
  "categoryTitle": categories[0]->title,
  "categoryId": categories[0]->_id
}`;

const RELATED_QUERY = `*[_type == "post" && slug.current != $slug && categories[0]->_id == $categoryId] | order(publishedAt desc)[0..2] {
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  mainImage,
  "authorName": author->name,
  "categoryTitle": categories[0]->title
}`;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });
  if (!post) return { title: "Artikel tidak ditemukan | Pemuda Pendidikan Nusantara" };

  const ogImageUrl = post.mainImage
    ? urlForImage(post.mainImage).width(1200).height(630).fit("crop").url()
    : "/logo.png";

  return {
    title: `${post.title} | Pemuda Pendidikan Nusantara`,
    description: post.excerpt || "Jurnal dan artikel dari Pemuda Pendidikan Nusantara.",
    openGraph: {
      type: "article", locale: "id_ID", siteName: "Pemuda Pendidikan Nusantara",
      title: post.title,
      description: post.excerpt || "Jurnal dan artikel dari Pemuda Pendidikan Nusantara.",
      publishedTime: post.publishedAt,
      authors: post.authorName ? [post.authorName] : ["Tim PPN"],
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image", title: post.title,
      description: post.excerpt || "Jurnal dan artikel dari Pemuda Pendidikan Nusantara.",
      images: [ogImageUrl],
    },
  };
}

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });
  if (!post) notFound();

  // Fetch related articles by same category
  const related = post.categoryId
    ? await client.fetch(RELATED_QUERY, { slug, categoryId: post.categoryId })
    : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dpn-pendidikan.vercel.app";
  const articleUrl = `${siteUrl}/artikel/${slug}`;

  const components = {
    block: {
      h2: ({ children }: any) => <h2 className="text-3xl md:text-4xl font-black text-primary mt-12 mb-6 tracking-tight">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-2xl font-black text-primary mt-8 mb-4 tracking-tight">{children}</h3>,
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-accent pl-6 py-2 my-8 italic text-slate-600 bg-accent/5 rounded-r-2xl">
          {children}
        </blockquote>
      ),
    },
    marks: {
      link: ({ children, value }: any) => {
        const rel = !value.href.startsWith("/") ? "noreferrer noopener" : undefined;
        return <Link href={value.href} rel={rel} className="text-brand underline decoration-brand/30 hover:decoration-brand transition-all">{children}</Link>;
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ReadingProgress />
      <div className="bg-[#f8fafc] pt-20 pb-2">
        <Navbar />
      </div>

      <article className="pb-20 pt-8 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/artikel" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-brand transition-colors mb-10">
            <ArrowLeft size={16} /> Kembali ke Jurnal
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-block bg-accent px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-6 shadow-sm">
              {post.categoryTitle || "Umum"}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary leading-tight tracking-tighter mb-8">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-slate-200">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Author */}
                <Link
                  href={post.authorSlug ? `/penulis/${post.authorSlug}` : "#"}
                  className="flex items-center gap-3 group/author"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm ring-2 ring-transparent group-hover/author:ring-brand transition-all">
                    {post.authorImage && (
                      <Image width={40} height={40} src={urlForImage(post.authorImage).url()} alt={post.authorName} className="object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary leading-none group-hover/author:text-brand transition-colors">{post.authorName || "Tim PPN"}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{post.authorRole || "Kontributor"}</p>
                  </div>
                </Link>

                <div className="w-px h-8 bg-slate-200" />

                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={13} />
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                    : "Draft"}
                </div>
              </div>

              {/* Share & Bookmark buttons */}
              <div className="flex items-center gap-3">
                <BookmarkButton 
                  post={{
                    slug: post.slug,
                    title: post.title,
                    excerpt: post.excerpt || "",
                    authorName: post.authorName || "Tim PPN",
                    categoryTitle: post.categoryTitle || "Umum",
                    publishedAt: post.publishedAt || new Date().toISOString(),
                  }} 
                />
                <ShareButton title={post.title} url={articleUrl} />
              </div>
            </div>
          </div>

          {/* Hero image */}
          {post.mainImage && (
            <div className="w-full h-[360px] md:h-[480px] rounded-[28px] overflow-hidden mb-12 relative shadow-[0_20px_60px_-15px_rgba(30,58,138,0.12)] border border-slate-100">
              <Image
                src={urlForImage(post.mainImage).width(1200).height(800).url()}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )}

          {/* Article body */}
          <div id="article-content" className="prose prose-lg md:prose-xl prose-slate max-w-none prose-headings:font-black prose-img:rounded-[28px]">
            {post.body && <PortableText value={post.body} components={components} />}
          </div>

          {/* Claps & Share CTA — bottom of article */}
          <div className="mt-14 p-6 sm:p-8 rounded-[28px] bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-between gap-6">
              
              {/* Claps Section */}
              <div className="flex items-center gap-4">
                 <ClapButton postId={post._id} initialClaps={post.claps || 0} />
              </div>

              <div className="w-full sm:w-px h-px sm:h-12 bg-slate-100" />

              {/* Share Section */}
              <div className="flex items-center gap-4">
                <div className="text-center sm:text-right">
                  <p className="font-black text-primary text-sm leading-tight">Bagikan Artikel</p>
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5">Ke teman & jaringanmu.</p>
                </div>
                <ShareButton title={post.title} url={articleUrl} />
              </div>

            </div>
          </div>
        </div>
      </article>

      {/* ── Related Articles ── */}
      {related.length > 0 && (
        <section className="pb-24 px-5 sm:px-6 bg-[#f8fafc]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Baca Juga</p>
                <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Artikel Terkait</h2>
              </div>
              <Link href="/artikel" className="hidden sm:flex items-center gap-2 text-sm font-bold text-brand hover:underline">
                Semua Artikel <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel: any, i: number) => (
                <Link
                  key={i}
                  href={`/artikel/${rel.slug}`}
                  className="group bg-white rounded-[24px] overflow-hidden border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.12)]"
                >
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {rel.mainImage ? (
                      <Image
                        src={urlForImage(rel.mainImage).width(600).height(400).url()}
                        alt={rel.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen size={32} />
                      </div>
                    )}
                    {rel.categoryTitle && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-primary shadow-sm">
                        {rel.categoryTitle}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      <Calendar size={11} />
                      {rel.publishedAt
                        ? new Date(rel.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Draft"}
                    </div>
                    <h3 className="font-black text-primary text-base leading-snug group-hover:text-brand transition-colors line-clamp-2 mb-2">
                      {rel.title}
                    </h3>
                    {rel.excerpt && (
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{rel.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-brand font-bold text-xs">
                      Baca <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
