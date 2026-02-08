"use client";

import { PROGRAM_INFO } from "@/lib/program-config";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-white border-t border-black/5 pt-24 pb-12 px-12 md:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          
          {/* Coluna 1: Info do Programa */}
          <div className="space-y-6">
            <h3 className="font-black text-2xl tracking-tighter uppercase">
              {PROGRAM_INFO.name}
            </h3>
            <p className="text-black/60 leading-relaxed max-w-xs">
              {PROGRAM_INFO.description}
            </p>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest">Explorar</h4>
            <nav className="flex flex-col gap-4 text-sm font-medium">
              <Link href="#programa" className="hover:opacity-50 transition-opacity">O Programa</Link>
              <Link href="#agenda" className="hover:opacity-50 transition-opacity">Agenda</Link>
              <Link href="#docs" className="hover:opacity-50 transition-opacity">Documentação</Link>
            </nav>
          </div>

          {/* Coluna 3: Redes Sociais */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest">Social</h4>
            <div className="flex gap-6">
              <a href="#" className="hover:opacity-50 transition-opacity"><Facebook size={20} /></a>
              <a href="#" className="hover:opacity-50 transition-opacity"><Instagram size={20} /></a>
              <a href="#" className="hover:opacity-50 transition-opacity"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Coluna 4: Contacto */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest">Contacto</h4>
            <p className="text-sm font-medium">geral@portalsabermais.ao</p>
          </div>
        </div>

        <div className="pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
            © {currentYear} {PROGRAM_INFO.name}. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
            <Link href="/privacidade" className="hover:text-black transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-black transition-colors">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}