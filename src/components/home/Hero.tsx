import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center pt-28 lg:pt-36 pb-20 overflow-hidden bg-background">
      {/* Soft Ethereal Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-primary/5 rounded-full blur-[100px] md:blur-[140px] -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-accent/10 rounded-full blur-[100px] md:blur-[140px] -ml-40 -mb-40 pointer-events-none" />

      <div className="section-container relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Text Content */}
          <div className="lg:col-span-5 lg:pr-8 animate-fade-up">
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-brand leading-[1.1] mb-8 tracking-tight drop-shadow-sm">
              Akselerasi <span className="relative z-10 inline-block">
                Literasi
                <svg className="absolute w-full h-4 -bottom-1 left-0 text-accent/80 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="6" />
                </svg>
              </span>,<br />
              <span className="text-primary">Mencerdaskan Bangsa.</span>
            </h1>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              Wadah generasi muda Indonesia untuk mengabdi dan berkontribusi nyata dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="/artikel"
                className="inline-flex items-center justify-center gap-3 bg-brand text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 hover:opacity-90 hover:shadow-[0_10px_40px_-10px_rgba(30,58,138,0.4)] hover:-translate-y-1"
              >
                Baca Artikel
                <ArrowRight size={16} />
              </Link>
              <Link
                href="https://www.instagram.com/dutapersadanusantara"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 shadow-sm"
              >
                Instagram
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-slate-200">
              {/* Static avatar stack - no external requests */}
              <div className="flex -space-x-3">
                {["🧑‍🎓","👩‍🏫","🧑‍💼"].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm flex items-center justify-center text-base">
                    {emoji}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center shadow-sm text-xs font-bold text-slate-500">
                  +2k
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-normal">
                Bergabunglah bersama <br /><span className="text-primary">Ribuan Pemuda</span>
              </p>
            </div>
          </div>

          {/* Image Composition */}

          <div
            className="lg:col-span-7 relative h-[600px] lg:h-[700px] w-full mt-10 lg:mt-0 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            {/* Main Center Image - img1.jpg */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[70%] h-[75%] rounded-[40px] overflow-hidden shadow-[0_10px_40px_-10px_rgba(30,58,138,0.2)] border-4 border-white z-20">
              <Image
                src="/img1.jpg"
                alt="Hero 1"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 85vw, (max-width: 1200px) 50vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-8 left-8 text-white">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Misi Tercapai</span>
                <h3 className="text-2xl font-bold leading-tight">Senyum Anak <br />Pedalaman</h3>
              </div>
            </div>

            {/* Smaller Floating Image Top Right - img3.jpg */}
            <div
              className="absolute top-[5%] right-[5%] w-[45%] h-[35%] rounded-[32px] overflow-hidden shadow-[0_10px_40px_-10px_rgba(30,58,138,0.2)] border-4 border-white z-10 hidden sm:block animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <Image
                src="/img3.jpg"
                alt="Hero 2"
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>

            {/* Smaller Floating Image Bottom Left - img5.jpg */}
            <div
              className="absolute bottom-[5%] left-[5%] w-[40%] h-[35%] rounded-[32px] overflow-hidden shadow-[0_10px_40px_-10px_rgba(30,58,138,0.2)] border-4 border-white z-30 hidden sm:block animate-fade-in"
              style={{ animationDelay: "500ms" }}
            >
              <Image
                src="/img5.jpg"
                alt="Hero 3"
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 40vw, 20vw"
              />
            </div>

            {/* Floating Info Card — CSS float animation */}
            <div className="absolute top-1/4 -left-4 sm:left-4 z-40 bg-white p-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(30,58,138,0.15)] border border-slate-100 flex items-center gap-4 animate-float">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Dampak Nyata</p>
                <p className="text-lg font-black text-primary">1.000+ Pemuda Tergerak</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
