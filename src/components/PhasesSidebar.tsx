"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface PhasesSidebarProps {
  activePhaseIndex: number;
  goToPhase: (index: number) => void;
  phases: { id: string; name: string }[];
  setIsHovering: (hovering: boolean) => void;
}

export function PhasesSidebar({ activePhaseIndex, goToPhase, phases, setIsHovering }: PhasesSidebarProps) {
  return (
    <div className="flex flex-col items-end gap-5 py-4 pointer-events-auto">
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
              outline-none cursor-pointer md:cursor-none transition-all duration-1000
              ${isActive ? "scale-105" : "scale-100"}
            `}
          >
            {/* 1. FUNDO VIDRO PURO (98% Transparente) */}
            <div className={`
              absolute inset-0 rounded-xl backdrop-blur-3xl z-0 transition-all duration-1000
              ${isActive 
                ? "bg-white/[0.08] shadow-[0_0_40px_rgba(255,255,255,0.05)] border-white/20" 
                : "bg-white/[0.02] border-white/5"} 
              border
            `} />

            {/* 2. EFEITO ESTRELA CADENTE (SVG Path) */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 256 56"
                preserveAspectRatio="none"
                fill="none"
              >
                {/* O rastro de luz suave */}
                <motion.rect
                  x="0.75" y="0.75" rx="11"
                  width="calc(100% - 1.5px)" height="calc(100% - 1.5px)"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ filter: "blur(1px)" }} // O toque premium de desfoque
                  initial={{ pathLength: 0.15, pathOffset: 0 }}
                  animate={{ pathOffset: 1 }}
                  transition={{
                    duration: 4, // Mais lento e elegante
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.8 // Desincronização orgânica
                  }}
                  className={isActive ? "opacity-100" : "opacity-20"}
                />
              </svg>
            </div>

            {/* 3. TEXTO DA FASE */}
            <span
              className={`
                relative z-20 text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-bold 
                transition-all duration-1000
                ${isActive 
                  ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
                  : "text-white/20 group-hover:text-white/60"
                }
              `}
            >
              {phase.name}
            </span>

            {/* 4. INDICADOR DE FOCO LATERAL (Discreto) */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute -right-2 w-1 h-8 bg-white rounded-full shadow-[0_0_15px_white] z-30"
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}