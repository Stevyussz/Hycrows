import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Programs from "@/components/home/Programs";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <div id="gabung" className="section-padding bg-gradient-to-br from-brand to-[#1d4ed8] overflow-hidden relative">
        {/* Background image with overlay */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img
            src="/bcg.jpg"
            alt="Bergabung Bersama Kami Background"
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(5) blur(0px)' }}
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/80 to-[#1d4ed8]/80 mix-blend-multiply" />
        </div>
        <div className="hover:opacity-0 transition-opacity section-container text-center relative z-10">
          <div className="inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent text-[11px] font-bold uppercase tracking-[0.2em] mb-8 shadow-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Bergabung Bersama Kami
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tight leading-tight">
            Sudah Siap Menjadi <br />
            <span className="text-accent drop-shadow-sm">Bagian dari Perubahan?</span>
          </h2>
          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Bergabunglah dengan ribuan pemuda terpilih lainnya dan jadilah inspirasi bagi pelosok Nusantara. K.
          </p>
          <a
            href="#gabung"
            className="inline-flex items-center justify-center bg-accent text-primary px-10 py-5 rounded-2xl font-bold text-sm hover:bg-accent-light transition-premium shadow-lg shadow-accent/20 hover:-translate-y-1"
          >
            Daftar Seleksi Duta Persada Nusantara Sekarang
          </a>
        </div>
        {/* Soft Ethereal Lights */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] -mr-80 -mt-80" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] -ml-80 -mb-80" />
      </div>

      <Programs />
      <Footer />
    </main>
  );
}
