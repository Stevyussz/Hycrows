import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, User, ArrowRight } from "lucide-react";

import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";

const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) {
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  mainImage,
  "authorName": author->name,
  "categoryTitle": categories[0]->title
}`;

export default async function ArtikelPage() {
  const posts = await client.fetch(POSTS_QUERY);

  return (
    <main className="min-h-screen bg-background dark:bg-[#080c14]">
      <div className="bg-background dark:bg-[#080c14] pt-32 pb-4">
        <Navbar />
      </div>

      <section className="section-padding pt-0">
        <div className="section-container">
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-primary dark:text-white mb-4 tracking-tighter">
              Jurnal & <span className="text-brand">Artikel.</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg">
              Kumpulan cerita aksi mengajar, liputan kegiatan, serta tips seputar pendidikan dan beasiswa dari pengurus Pemuda Pendidikan Nusantara.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.length > 0 ? (
              posts.map((article: any, i: number) => (
                <Link href={`/artikel/${article.slug}`} key={i} className="group flex flex-col bg-white dark:bg-[#0a0f18] rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 transition-premium hover:-translate-y-2 hover:shadow-premium">
                  <div className="w-full h-64 relative overflow-hidden bg-slate-100">
                    {article.mainImage ? (
                      <Image 
                        fill 
                        src={urlForImage(article.mainImage).url()} 
                        alt={article.title} 
                        className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-primary dark:text-white shadow-sm">
                      {article.categoryTitle || "Umum"}
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> 
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "Draft"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={14} /> 
                        {article.authorName || "Tim PPN"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-primary dark:text-white mb-3 tracking-tight group-hover:text-brand transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 flex-grow">
                      {article.excerpt}
                    </p>

                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-primary dark:text-white group-hover:text-brand font-bold text-sm transition-colors">
                      <span>Baca Selengkapnya</span>
                      <ArrowRight size={16} className="-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 font-medium">Belum ada artikel yang diterbitkan.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
