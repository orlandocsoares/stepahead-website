"use client";

import { motion, AnimatePresence } from "framer-motion";

interface PhasesSidebarProps {
  activePhaseIndex: number;
  goToPhase: (index: number) => void;
  phases: { id: string; name: string }[];
  setIsHovering: (hovering: boolean) => void;
}

export function PhasesSidebar({ activePhaseIndex, goToPhase, phases, setIsHovering }: PhasesSidebarProps) {
  return (
    <div className="flex flex-col items-end gap-2 sm:gap-4 lg:gap-5 py-2 sm:py-4 pointer-events-auto">
      {phases.map((phase, index) => {
        if (index === 0) return null;
        
        const isActive = activePhaseIndex === index;

        return (
          <button
            key={phase.id}
            onClick={() => goToPhase(index)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`
              group relative w-44 md:w-64 h-14 rounded-xl flex items-center justify-center 
              outline-none cursor-pointer md:cursor-none transition-all duration-700
              ${isActive ? "scale-[1.03]" : "scale-100 hover:scale-[1.02]"}
            `}
          >
            {/* 1. FUNDO VIDRO PREMIUM (Bordas limpas, sem sobreposição) */}
            <div className={`
              absolute inset-0 rounded-xl backdrop-blur-xl transition-all duration-700 z-0
              ${isActive 
                ? "bg-white/[0.15] shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-white/40" 
                : "bg-white/[0.04] border border-white/10 group-hover:bg-white/[0.12] group-hover:border-white/30"} 
            `} />

            {/* 2. EFEITO GLOW INTERNO NO HOVER/ACTIVE */}
            <div className={`
              absolute inset-0 rounded-xl transition-opacity duration-700 z-10 pointer-events-none
              bg-gradient-to-r from-transparent via-white/[0.08] to-transparent
              ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
            `} />

            {/* 3. TEXTO DA FASE */}
            <span
              className={`
                relative z-20 text-[11px] md:text-[12px] uppercase tracking-[0.55em] md:tracking-[0.6em] font-medium font-sans
                leading-none transition-all duration-700 truncate px-4
                ${isActive 
                  ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] font-bold" 
                  : "text-white/70 group-hover:text-white/95"}
              `}
              title={phase.name}
            >
              {phase.name}
            </span>

            {/* 4. INDICADOR DE FOCO LATERAL (Alinhado perfeitamente à borda direita) */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute right-[1px] top-1/2 -translate-y-1/2 w-[3px] h-[55%] bg-white rounded-l-full shadow-[0_0_12px_rgba(255,255,255,0.9)] z-30 origin-center pointer-events-none"
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}