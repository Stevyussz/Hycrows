"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShieldCheck, Users, Globe, BookOpen } from "lucide-react";

const stats = [
  { label: "Buku Tersalurkan", value: "10K+", icon: BookOpen },
  { label: "Relawan Pengajar", value: "2.500+", icon: Users },
  { label: "Desa Binaan", value: "38+", icon: Globe },
  { label: "Beasiswa", value: "150+", icon: ShieldCheck },
];

const programs = [
  { title: "Pemberdayaan Pemuda", description: "Membekali pemuda dengan keterampilan kepemimpinan dan manajemen organisasi untuk dampak sosial.", icon: Users, color: "bg-blue-100 text-blue-600" },
  { title: "Pelestarian Budaya", description: "Mengintegrasikan nilai-nilai kearifan lokal dalam setiap aksi nyata untuk menjaga identitas bangsa.", icon: Globe, color: "bg-emerald-100 text-emerald-600" },
  { title: "Advokasi Pendidikan", description: "Mendorong akses pendidikan yang merata melalui program literasi dan pendampingan di daerah.", icon: BookOpen, color: "bg-amber-100 text-amber-600" },
];

const About = () => {
  return (
    <section id="tentang" className="section-padding bg-white dark:bg-[#060a10] overflow-hidden">
      <div className="section-container">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-1/2"
          >
            <div className="w-16 h-1.5 bg-accent mb-10 rounded-full" />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary dark:text-white mb-8 leading-tight tracking-tight">
              Membangun Bangsa <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent relative">
                Melalui Akses Pendidikan.
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              Pemuda Pendidikan Nusantara hadir untuk mensinergikan potensi mahasiswa dan pemuda dalam mengakselerasi literasi di setiap sudut negeri.
            </p>
            <p className="text-slate-500 dark:text-slate-500 mb-12 leading-relaxed">
              Kami percaya bahwa pendidikan adalah senjata paling ampuh untuk mengubah dunia. Bersama ribuan relawan pengajar, kami turun tangan mendidik dan menginspirasi generasi emas Indonesia 2045.
            </p>

            <div className="grid grid-cols-2 gap-x-12 gap-y-10">
              {stats.map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent transition-premium group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                      <stat.icon size={18} />
                    </div>
                    <h4 className="text-3xl font-black text-primary dark:text-white tracking-tighter">{stat.value}</h4>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-accent transition-colors pl-14">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-1/2 relative p-4"
          >
            <div className="relative z-10 grid grid-cols-2 gap-5">
              <div className="space-y-5 pt-16">
                <div className="rounded-[32px] overflow-hidden shadow-premium h-72 border-4 border-white dark:border-white/5 bg-slate-100 group">
                  <Image width={400} height={400} src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80" alt="Teaching Activity" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="rounded-[32px] bg-brand text-white p-8 flex flex-col justify-end h-48 shadow-lg shadow-brand/20">
                  <p className="text-white font-black text-2xl leading-tight">Literasi</p>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2">Core Values</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="rounded-[32px] bg-accent text-primary p-8 flex flex-col justify-end h-48 shadow-lg shadow-accent/30">
                  <p className="text-primary font-black text-2xl leading-tight">Dedikasi</p>
                  <p className="text-primary/70 text-xs font-bold uppercase tracking-widest mt-2">Identity</p>
                </div>
                <div className="rounded-[32px] overflow-hidden shadow-premium h-72 border-4 border-white dark:border-white/5 bg-slate-100 group">
                  <Image width={400} height={400} src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80" alt="Education Culture" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};


export default About;
