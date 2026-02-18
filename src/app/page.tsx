import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { KnowledgeTreeSection } from "@/components/KnowledgeTreeSection";
import { Footer } from "@/components/Footer";
import { Bubbles } from "@/components/Bubbles"; 

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white selection:bg-black selection:text-white">
      {/* 1. Componentes Fixos e Globais */}
      <Bubbles /> {/* Animação que aparece quando paras de mexer o rato */}
      <Navbar />  {/* Menu fixo no topo */}

      {/* 2. Fluxo da Página */}
      <HeroSection />          {/* Galáxia e Introdução */}
      <KnowledgeTreeSection /> {/* Vídeo da Árvore com Scroll */}
      
      {/* 3. Rodapé */}
      <Footer />
    </main>
  );
}
