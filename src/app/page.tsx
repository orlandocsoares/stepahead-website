"use client";

import { HeroSection } from "../components/HeroSection";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function Page() {
  return (
    <main className="bg-black min-h-screen relative">
      {/* Navbar fica fixa no topo */}
      <Navbar />
      
      {/* Hero com a animação das imagens */}
      <HeroSection />
      
      {/* Footer aparece no fundo */}
      <Footer />
    </main>
  );
}