import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { client } from "@/sanity/lib/client";
import ArtikelClient from "./ArtikelClient";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jurnal & Artikel | Pemuda Pendidikan Nusantara",
  description: "Kumpulan cerita aksi mengajar, liputan kegiatan, serta tips seputar pendidikan dan beasiswa dari pengurus Pemuda Pendidikan Nusantara.",
};

const POST_FIELDS = `
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  mainImage,
  "authorName": author->name,
  "categoryTitle": categories[0]->title
`;

// All published posts (for grid + filter)
const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) { ${POST_FIELDS} }`;

// 1 featured article (editor-picked)
const FEATURED_QUERY = `*[_type == "post" && defined(slug.current) && isFeatured == true] | order(publishedAt desc)[0] { ${POST_FIELDS} }`;

// Up to 5 popular/editor's pick articles
const POPULAR_QUERY = `*[_type == "post" && defined(slug.current) && isPopular == true] | order(publishedAt desc)[0..4] { ${POST_FIELDS} }`;

export default async function ArtikelPage() {
  const [posts, featured, popular] = await Promise.all([
    client.fetch(POSTS_QUERY, {}, { next: { revalidate: 60 } }),
    client.fetch(FEATURED_QUERY, {}, { next: { revalidate: 60 } }),
    client.fetch(POPULAR_QUERY, {}, { next: { revalidate: 60 } }),
  ]);

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
              Kumpulan cerita aksi mengajar, liputan kegiatan, serta tips seputar pendidikan dan beasiswa dari pengurus Pemuda Pendidikan Nusantara.
            </p>
          </div>

          <ArtikelClient posts={posts} featured={featured ?? null} popular={popular ?? []} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
