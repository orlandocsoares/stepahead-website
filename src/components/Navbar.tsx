"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PROGRAM_INFO, DASHBOARD_URL } from "@/lib/program-config";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Ativa o fundo branco mais cedo (10px) para melhor leitura
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-12 md:px-24 py-6 flex items-center justify-between border-b",
      // LÓGICA DE CORES:
      // Se Scroll: Fundo Branco, Texto Preto
      // Sem Scroll: Fundo Transparente, Texto BRANCO (para ver na galáxia)
      isScrolled 
        ? "bg-white border-black/10 py-3 shadow-sm text-black" 
        : "bg-transparent border-transparent text-white mix-blend-difference"
    )}>
      <div className="flex items-center gap-2">
        <Link href="/" className="font-headline font-black text-xl tracking-tighter uppercase italic">
          {PROGRAM_INFO.name}
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8 font-headline text-xs tracking-widest uppercase font-semibold">
        <Link href="#programa" className="hover:opacity-50 transition-opacity">Programa</Link>
        <Link href="#agenda" className="hover:opacity-50 transition-opacity">Agenda</Link>
        <Link href="#documentacao" className="hover:opacity-50 transition-opacity">Documentação</Link>
        <a 
          href={DASHBOARD_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className={cn(
            "px-6 py-3 font-bold transition-colors",
            isScrolled ? "bg-black text-white hover:bg-black/80" : "bg-white text-black hover:bg-white/90"
          )}
        >
          Entrar
        </a>
      </div>
    </nav>
  );
}