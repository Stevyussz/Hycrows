import { ArrowRight, Palmtree, Users2, GraduationCap, HeartHandshake, Presentation, BookOpen } from "lucide-react";

const programs = [
  {
    title: "Jumasi (Jumat Literasi)",
    description: "Program literasi untuk membiasakan membaca dan menulis melalui unggahan Instagram Story serta eksplorasi karya seperti buku dan cerpen.",
    icon: Users2,
  },
  {
    title: "Competition",
    description: "Ajang lomba terbuka untuk mengasah kreativitas dan kemampuan peserta melalui berbagai kategori seperti poster, esai, dan lainnya.",
    icon: BookOpen,
  },
  {
    title: "Act To Inspire",
    description: "Program kegiatan offline individu bertema pendidikan yang mendorong kontribusi langsung di lapangan, dilanjutkan dengan Nyala Asa Nusantara sebagai tindak lanjut.",
    icon: GraduationCap,
  },
  {
    title: "EduVibes",
    description: "Live Instagram interaktif yang membahas isu pendidikan terkini serta menghadirkan sesi bedah buku.",
    icon: Palmtree,
  },
  {
    title: "EduTalk",
    description: "Webinar via Zoom dengan pemateri internal dan eksternal yang membahas isu pendidikan penting dan актуal.",
    icon: HeartHandshake,
  },
  {
    title: "Edu Content",
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
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-block px-5 py-2 rounded-full bg-accent border border-accent/20 text-primary text-[11px] font-bold uppercase tracking-[0.2em] mb-6 shadow-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Visi & Misi Edukasi
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6 tracking-tight leading-tight">
              Pilar Utama <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent relative">
                Pengabdian Nusantara.
              </span>
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Fokus strategis Pemuda kami untuk memastikan setiap pemuda dapat berkontribusi secara nyata meningkatkan taraf literasi masyarakat.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, i) => (
            <div
              key={i}
              className="group p-10 rounded-[32px] bg-white border border-slate-100 transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.1)] hover:-translate-y-2 relative overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700 ease-out" />

              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 transition-all duration-300 group-hover:scale-110 shadow-sm border border-slate-100 relative z-10 text-brand">
                <program.icon size={28} />
              </div>
              <h3 className="text-2xl font-black text-primary mb-4 tracking-tight group-hover:text-brand transition-colors relative z-10">
                {program.title}
              </h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm relative z-10 mb-8">
                {program.description}
              </p>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-center relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-brand transition-colors">Telusuri</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 text-primary flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-colors cursor-pointer">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
