"use client";

import { PROGRAM_INFO } from "@/lib/program-config";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black text-white py-24 px-12 md:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">
              {PROGRAM_INFO.name}
            </h3>
            <p className="text-neutral-400 max-w-md font-body leading-relaxed text-sm">
              {PROGRAM_INFO.description}
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white hover:text-neutral-400 transition-colors"><Linkedin size={20} /></a>
              <a href="#" className="text-white hover:text-neutral-400 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-white hover:text-neutral-400 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-white hover:text-neutral-400 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black tracking-[0.2em] text-neutral-500 uppercase">Institucional</h4>
            <ul className="space-y-4 font-headline text-sm font-bold uppercase tracking-tight">
              <li><Link href="#" className="hover:opacity-60 transition-opacity">Sobre o Camões, I.P.</Link></li>
              <li><Link href="#" className="hover:opacity-60 transition-opacity">MED Angola - INFQE</Link></li>
              <li><Link href="#" className="hover:opacity-60 transition-opacity">Cooperação Internacional</Link></li>
              <li><Link href="#" className="hover:opacity-60 transition-opacity">Privacidade e Termos</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black tracking-[0.2em] text-neutral-500 uppercase">Impacto</h4>
            <div className="space-y-2">
              <p className="text-3xl font-black tracking-tighter uppercase leading-none">{PROGRAM_INFO.stats}</p>
              <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Compromisso com o Futuro</p>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between gap-8 text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-500">
          <p>© {new Date().getFullYear()} {PROGRAM_INFO.name}. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <span>Desenvolvido por Camões, I.P.</span>
            <span>Luanda - Lisboa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
