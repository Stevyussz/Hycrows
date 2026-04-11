"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center pt-28 lg:pt-36 pb-20 overflow-hidden bg-background">
      {/* Soft Ethereal Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-primary/5 rounded-full blur-[100px] md:blur-[140px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-accent/10 rounded-full blur-[100px] md:blur-[140px] -ml-40 -mb-40" />

      <div className="section-container relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text Content - Spans 5 columns */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:pr-8"
          >
            
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-brand leading-[1.1] mb-8 tracking-tight drop-shadow-sm">
              Akselerasi <span className="relative z-10 inline-block">
                Literasi
                <svg className="absolute w-full h-4 -bottom-1 left-0 text-accent/80 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="6" />
                </svg>
              </span>,<br />
              <span className="text-primary">Mencerdaskan Bangsa.</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              Wadah generasi muda Indonesia untuk mengabdi dan berkontribusi nyata dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="#gabung"
                className="inline-flex items-center justify-center gap-3 bg-brand text-white px-8 py-4.5 rounded-2xl font-bold text-sm transition-premium hover:opacity-90 hover:shadow-premium hover:-translate-y-1"
              >
                Baca Artikel
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#program"
                className="inline-flex items-center justify-center px-8 py-4.5 rounded-2xl font-bold text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-premium shadow-sm"
              >
                Katalog Program
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-slate-200 dark:border-white/10">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#080c14] bg-slate-100 overflow-hidden shadow-sm">
                    <Image src={`https://i.pravatar.cc/100?u=dpn${i}`} alt="Relawan" width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#080c14] bg-slate-50 flex items-center justify-center shadow-sm text-xs font-bold text-slate-500">
                  +2k
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-normal">
                Bergabunglah bersama <br /><span className="text-primary dark:text-white">Ribuan Relawan</span>
              </p>
            </div>
          </motion.div>

          {/* Abstract Image Composition - Spans 7 columns */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-7 relative h-[600px] lg:h-[700px] w-full mt-10 lg:mt-0"
          >
            {/* Main Center Image */}
            <motion.div 
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[70%] h-[75%] rounded-[40px] overflow-hidden shadow-premium border-4 border-white dark:border-white/5 z-20"
            >
              <Image 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80" 
                alt="Pendidikan" 
                fill 
                className="object-cover" 
                priority 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-80" />
              <div className="absolute bottom-8 left-8 text-white">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Misi Tercapai</span>
                <h3 className="text-2xl font-bold leading-tight">Senyum Anak <br />Pedalaman</h3>
              </div>
            </motion.div>

            {/* Smaller Floating Image Top Right */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute top-[5%] right-[5%] w-[45%] h-[35%] rounded-[32px] overflow-hidden shadow-premium border-4 border-white dark:border-white/5 z-10 hidden sm:block"
            >
              <Image 
                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80" 
                alt="Belajar" 
                fill 
                className="object-cover" 
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </motion.div>

            {/* Smaller Floating Image Bottom Left */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute bottom-[5%] left-[5%] w-[40%] h-[35%] rounded-[32px] overflow-hidden shadow-premium border-4 border-white dark:border-white/5 z-30 hidden sm:block"
            >
              <Image 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80" 
                alt="Sekolah" 
                fill 
                className="object-cover" 
                sizes="(max-width: 768px) 40vw, 25vw"
              />
            </motion.div>

            {/* Floating Info Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 -left-4 sm:left-4 z-40 bg-white dark:bg-[#0a0f18] p-5 rounded-2xl shadow-premium border border-slate-100 dark:border-white/10 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Dampak Nyata</p>
                <p className="text-lg font-black text-primary dark:text-white">10.000+ Buku</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

