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
          className="pointer-events-auto cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
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
