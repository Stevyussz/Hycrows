"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer id="kontak" className="bg-primary text-white pt-20 lg:pt-24 pb-12 overflow-hidden relative border-t border-white/5">
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="relative w-16 h-16 bg-white rounded-2xl shadow-lg border border-white/10 overflow-hidden flex items-center justify-center p-1.5 transition-premium group-hover:shadow-xl">
                <Image
                  src="/logo.png"
                  alt="DPN Logo"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">
                  Part of Duta Persada Nusantara
                </span>
                <span className="font-black text-[15px] leading-tight uppercase tracking-tight text-white">
                  Pemuda Pendidikan
                </span>
                <span className="text-accent text-[10px] font-black tracking-[0.25em] mt-1 uppercase">
                  Nusantara
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs font-medium">
              Wadah kolaborasi pemuda Indonesia untuk meningkatkan literasi dan kualitas pendidikan di seluruh penjuru Nusantara.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Instagram, href: "https://instagram.com/dutapersadanusantara" },
                { icon: Facebook, href: "#" },
                { icon: Twitter, href: "#" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-accent hover:border-accent transition-premium group"
                >
                  <social.icon size={18} className="group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-lg mb-8 text-white uppercase tracking-wider underline decoration-accent decoration-2 underline-offset-[12px]">Pranala</h4>
            <ul className="space-y-4">
              {["Beranda", "Tentang Kami", "Katalog Program", "Jurnal & Artikel"].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase().replace(/\s+/g, '')}`} className="text-slate-400 font-medium hover:text-accent transition-colors flex items-center gap-2 group text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-accent transition-colors" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-lg mb-8 text-white uppercase tracking-wider underline decoration-accent decoration-2 underline-offset-[12px]">Kontak</h4>
            <ul className="space-y-6">
              {[
                { icon: MapPin, text: "Indonesia" },
                { icon: Phone, text: "+62 8xxx-xxxx" },
                { icon: Mail, text: "dpn.pemudapendidikan@gmail.com" }
              ].map((contact, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                    <contact.icon className="text-accent" size={18} />
                  </div>
                  <span className="text-slate-400 font-medium text-sm pt-2">{contact.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-lg mb-8 text-white uppercase tracking-wider underline decoration-accent decoration-2 underline-offset-[12px]">Buletin</h4>
            <p className="text-slate-400 text-sm mb-6 font-medium">Dapatkan informasi terbaru mengenai seleksi periode 2026.</p>
            <div className="flex flex-col gap-3" suppressHydrationWarning>
              <input
                type="email"
                placeholder="Email aktif"
                className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-accent transition-colors w-full"
              />
              <button className="bg-accent text-primary font-black py-4 rounded-xl text-sm uppercase tracking-widest hover:bg-accent-light transition-premium shadow-lg shadow-accent/10">
                Berlangganan
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          <p>© {currentYear} Duta Persada Nusantara. All Rights Reserved.</p>
          
          <a 
            href="https://yusrilastaghina.my.id/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="relative group py-2 px-4 border border-white/5 rounded-full hover:border-accent/30 transition-all duration-500 bg-white/[0.02] flex items-center gap-2"
          >
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Digital Craft by</span>
            <span className="text-accent underline decoration-accent/20 underline-offset-4 group-hover:decoration-accent transition-all">Yusril Astaghina</span>
            <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </a>

          <div className="flex gap-10">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Background Graphic Subtle */}
      <div className="absolute top-0 right-0 w-1/4 h-full bg-accent/3 -skew-x-12 translate-x-20 hidden lg:block" />
    </footer>
  );
};


export default Footer;
