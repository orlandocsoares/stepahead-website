"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ActivityAgenda } from "@/components/ActivityAgenda";
import { DocumentRepository } from "@/components/DocumentRepository";
import { Footer } from "@/components/Footer";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const communityImage = PlaceHolderImages.find(img => img.id === 'educators-circle');

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <HeroSection />

      <section id="programa" className="py-24 px-12 md:px-24 bg-white relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <span className="font-headline text-xs font-black tracking-[0.3em] uppercase text-black/40">O Projecto</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                Inovação na <br /> Formação <br /> de Docentes
              </h2>
              <p className="text-lg text-neutral-600 font-body leading-relaxed max-w-lg">
                O Programa Saber Mais representa o pilar da cooperação institucional entre Portugal e Angola no setor educativo, assegurando uma formação de excelência e recursos pedagógicos de vanguarda para a nova geração de professores.
              </p>
              <div className="pt-4 flex items-center gap-12">
                <div className="space-y-1">
                  <p className="text-3xl font-black uppercase">120</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Escolas Abrangidas</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black uppercase">500+</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Formadores Ativos</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-square bg-neutral-100 border border-black p-4">
              <div className="absolute -top-12 -right-12 w-48 h-48 border-8 border-black/5 pointer-events-none"></div>
              <img 
                src={communityImage?.imageUrl || "https://picsum.photos/seed/sabermais/800/800"} 
                alt="Institutional Image" 
                className="w-full h-full object-cover grayscale"
                data-ai-hint={communityImage?.imageHint || "educators circle"}
              />
            </div>
          </div>
        </div>
      </section>

      <ActivityAgenda />

      <DocumentRepository />

      <Footer />
    </main>
  );
}
