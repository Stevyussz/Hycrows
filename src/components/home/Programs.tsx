"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Palmtree, Landmark, Users2, GraduationCap, HeartHandshake, Presentation, BookOpen } from "lucide-react";

const programs = [
  {
    title: "Mengajar Pelosok",
    description: "Pengiriman relawan pengajar ke daerah 3T untuk membantu mendidik siswa secara langsung.",
    icon: Users2,
  },
  {
    title: "Donasi Buku",
    description: "Penggalangan dan penyaluran buku bacaan berkualitas untuk memajukan perpustakaan desa.",
    icon: BookOpen,
  },
  {
    title: "Mentoring Beasiswa",
    description: "Bimbingan intensif persiapan masuk PTN dan pengajuan beasiswa bagi siswa kurang mampu.",
    icon: GraduationCap,
  },
  {
    title: "Literasi Digital",
    description: "Kampanye pemahaman teknologi edukatif agar siswa melek perkembangan masa depan cerdas.",
    icon: Palmtree,
  },
  {
    title: "Aksi Sosial Sekolah",
    description: "Renovasi dan perbaikan infrastruktur sederhana agar proses belajar menjadi senyaman mungkin.",
    icon: HeartHandshake,
  },
  {
    title: "Latihan Kepemimpinan",
    description: "Membentuk karakter pemuda-pemudi daerah melalui workshop pengembangan kepemimpinan diri.",
    icon: Presentation,
  },
];

const Programs = () => {
  return (
    <section id="program" className="section-padding bg-background overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none" />
      
      <div className="section-container relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 lg:mb-24 gap-8">
          <div className="max-w-2xl">
            <div className="inline-block px-5 py-2 rounded-full bg-accent border border-accent/20 text-primary text-[11px] font-bold uppercase tracking-[0.2em] mb-6 shadow-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Visi & Misi Edukasi
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary dark:text-white mb-6 tracking-tight leading-tight">
              Pilar Utama <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent relative">
                Pengabdian Nusantara.
              </span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Fokus strategis relawan kami untuk memastikan setiap pemuda dapat berkontribusi secara nyata meningkatkan taraf literasi masyarakat.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="group p-10 rounded-[32px] bg-white dark:bg-[#0a0f18] border border-slate-100 dark:border-white/5 transition-premium hover:shadow-premium hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700 ease-out" />
              
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 transition-premium group-hover:scale-110 shadow-sm border border-slate-100 dark:border-white/5 relative z-10 text-brand">
                <program.icon size={28} />
              </div>
              <h3 className="text-2xl font-black text-primary dark:text-white mb-4 tracking-tight group-hover:text-brand transition-colors relative z-10">
                {program.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm relative z-10 mb-8">
                {program.description}
              </p>
              
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-brand transition-colors">Telusuri</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 text-primary flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-colors cursor-pointer">
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


export default Programs;
