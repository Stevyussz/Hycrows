import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  title,
  publishedAt,
  mainImage,
  body,
  excerpt,
  "authorName": author->name,
  "authorRole": author->role,
  "authorImage": author->image,
  "categoryTitle": categories[0]->title
}`;

// ---------------------------------------------------------------
// Open Graph & Twitter Card — Supaya link-nya bisa di-preview
// saat dishare ke WA, Telegram, Twitter/X, dll.
// ---------------------------------------------------------------
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });

  if (!post) {
    return {
      title: "Artikel tidak ditemukan | Pemuda Pendidikan Nusantara",
    };
  }

  const ogImageUrl = post.mainImage
    ? urlForImage(post.mainImage).width(1200).height(630).fit("crop").url()
    : "/logo.png";

  return {
    title: `${post.title} | Pemuda Pendidikan Nusantara`,
    description: post.excerpt || "Jurnal dan artikel dari Pemuda Pendidikan Nusantara.",
    openGraph: {
      type: "article",
      locale: "id_ID",
      siteName: "Pemuda Pendidikan Nusantara",
      title: post.title,
      description: post.excerpt || "Jurnal dan artikel dari Pemuda Pendidikan Nusantara.",
      publishedTime: post.publishedAt,
      authors: post.authorName ? [post.authorName] : ["Tim PPN"],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "Jurnal dan artikel dari Pemuda Pendidikan Nusantara.",
      images: [ogImageUrl],
    },
  };
}

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });

  if (!post) {
    notFound();
  }

  // Custom components for PortableText to match premium design
  const components = {
    block: {
      h2: ({ children }: any) => <h2 className="text-3xl md:text-4xl font-black text-primary mt-12 mb-6 tracking-tight">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-2xl font-black text-primary mt-8 mb-4 tracking-tight">{children}</h3>,
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-accent pl-6 py-2 my-8 italic text-slate-600 dark:text-slate-300 bg-accent/5 rounded-r-2xl">
          {children}
        </blockquote>
      ),
    },
    marks: {
      link: ({ children, value }: any) => {
        const rel = !value.href.startsWith("/") ? "noreferrer noopener" : undefined;
        return (
          <Link href={value.href} rel={rel} className="text-brand underline decoration-brand/30 hover:decoration-brand transition-all">
            {children}
          </Link>
        );
      },
    },
  };

  return (
    <main className="min-h-screen bg-background dark:bg-[#080c14]">
      <div className="bg-background dark:bg-[#080c14] pt-32 pb-4">
        <Navbar />
      </div>

      <article className="section-padding">
        <div className="max-w-3xl mx-auto">
          <Link href="/artikel" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-brand transition-colors mb-10">
            <ArrowLeft size={16} /> Kembali ke Jurnal
          </Link>

          <div className="mb-8">
            <div className="inline-block bg-accent px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-6 shadow-sm">
              {post.categoryTitle || "Umum"}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary dark:text-white leading-tight tracking-tighter mb-8 italic-marker">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border-2 border-white dark:border-[#080c14] shadow-sm">
                    {post.authorImage && (
                      <Image 
                        width={40} 
                        height={40} 
                        src={urlForImage(post.authorImage).url()} 
                        alt={post.authorName} 
                        className="object-cover" 
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary dark:text-white leading-none">{post.authorName || "Tim PPN"}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{post.authorRole || "Kontributor"}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={14} /> 
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "Recently Published"}
                </div>
              </div>
              <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-brand hover:border-brand transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className="w-full h-[400px] md:h-[500px] rounded-[32px] overflow-hidden mb-12 relative shadow-premium border border-slate-100 dark:border-white/10">
            {post.mainImage && (
              <Image
                src={urlForImage(post.mainImage).url()}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            )}
          </div>

          <div className="prose prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-img:rounded-[32px] articles-body">
            {post.body && <PortableText value={post.body} components={components} />}
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
