"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PROGRAM_INFO, DASHBOARD_URL } from "@/lib/program-config";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-12 md:px-24 py-4 flex items-center justify-between border-b",
      isScrolled ? "bg-white border-black/10 py-3 shadow-sm" : "bg-transparent border-transparent"
    )}>
      <div className="flex items-center gap-2">
        <Link href="/" className="font-headline font-black text-xl tracking-tighter uppercase">
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
          className="bg-black text-white px-4 py-2 hover:bg-black/80 transition-colors"
        >
          Entrar
        </a>
      </div>
    </nav>
  );
}
