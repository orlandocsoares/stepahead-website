
"use client";

import { motion } from "framer-motion";

export function Navbar() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-16 md:px-40 py-10 pointer-events-none">
      <div className="flex justify-between items-center w-full max-w-[1800px] mx-auto">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="pointer-events-auto cursor-pointer flex items-center gap-4" 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {/* Ícone de Lupa Estilizado */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5" />
              <path d="M20 20L16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
            </svg>
          </div>
          
          <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-black">
            Portal Saber Mais
          </h1>
        </motion.div>

        <div className="flex gap-12 pointer-events-auto">
          {["agenda"].map((item) => (
            <button 
              key={item} 
              onClick={() => scrollTo(item)}
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/30 hover:text-black transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
