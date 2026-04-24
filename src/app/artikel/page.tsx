import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { client } from "@/sanity/lib/client";
import ArtikelClient from "./ArtikelClient";
import type { Metadata } from "next";

// Revalidate every 60 seconds so new articles appear quickly
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jurnal & Artikel | Pemuda Pendidikan Nusantara",
  description:
    "Kumpulan cerita aksi mengajar, liputan kegiatan, serta tips seputar pendidikan dan beasiswa dari pengurus Pemuda Pendidikan Nusantara.",
};

const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  mainImage,
  "authorName": author->name,
  "categoryTitle": categories[0]->title
}`;

export default async function ArtikelPage() {
  const posts = await client.fetch(POSTS_QUERY, {}, { next: { revalidate: 60 } });

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#f8fafc] pt-20 pb-2">
        <Navbar />
      </div>

      <section className="section-padding pt-10">
        <div className="section-container">
          {/* Header */}
          <div className="mb-10">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
              Pemuda Pendidikan Nusantara
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
              Jurnal &amp; <span className="text-brand">Artikel.</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg">
              Kumpulan cerita aksi mengajar, liputan kegiatan, serta tips seputar pendidikan
              dan beasiswa dari pengurus Pemuda Pendidikan Nusantara.
            </p>
          </div>

          {/* Client component handles search + grid */}
          <ArtikelClient posts={posts} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
