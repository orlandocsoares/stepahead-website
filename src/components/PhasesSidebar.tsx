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
    <div className="hidden md:flex flex-col items-end gap-2 sm:gap-4 lg:gap-5 py-2 sm:py-4 pointer-events-auto">
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
            {/* 1. FUNDO VIDRO */}
            <div className={`
              absolute inset-0 rounded-xl backdrop-blur-xl transition-all duration-700 z-0
              ${isActive
                ? "bg-white/[0.12]"
                : "bg-white/[0.04] group-hover:bg-white/[0.10]"}
            `} />

            {/* 2. CONTORNO LUMINOSO ACTIVO COM PULSAR */}
            <AnimatePresence>
              {isActive && (
                <>
                  {/* Contorno fixo */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-xl border border-white/60 z-10 pointer-events-none"
                  />
                  {/* Glow pulsante por cima */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-xl shadow-[0_0_22px_rgba(255,255,255,0.5),inset_0_0_14px_rgba(255,255,255,0.1)] z-10 pointer-events-none"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Borda subtil no hover (sem activo) */}
            {!isActive && (
              <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/25 transition-all duration-700 z-10 pointer-events-none" />
            )}

            {/* 3. GLOW INTERNO */}
            <div className={`
              absolute inset-0 rounded-xl transition-opacity duration-700 z-10 pointer-events-none
              bg-gradient-to-r from-transparent via-white/[0.07] to-transparent
              ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
            `} />

            {/* 4. TEXTO DA FASE */}
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
          </button>
        );
      })}
    </div>
  );
}