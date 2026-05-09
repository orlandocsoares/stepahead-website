"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigatorProps {
  activePhaseIndex: number;
  goToPhase: (index: number) => void;
  setIsHovering: (hovering: boolean) => void;
}

export function Navigator({ activePhaseIndex, goToPhase, setIsHovering }: NavigatorProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 1 }}
      className="relative w-44 md:w-64 h-14 rounded-xl border border-white/40 grid grid-cols-[1fr,auto,1fr] items-center pointer-events-auto group/nav bg-transparent shadow-2xl"
    >
      {/* SETA ESQUERDA */}
      <button 
        onClick={() => goToPhase(activePhaseIndex - 1)} 
        onMouseEnter={() => setIsHovering(true)} 
        onMouseLeave={() => setIsHovering(false)} 
        className="flex items-center justify-center h-full outline-none group/btnl cursor-none border-r border-white/5"
      >
        <ChevronLeft 
          size={22} 
          strokeWidth={1} 
          className="text-white/30 group-hover/btnl:text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all" 
        />
      </button>

      {/* RELÓGIO DINÂMICO DE IMPACTO (44px) - PONTEIROS CORRIGIDOS */}
      <div className="flex items-center justify-center px-4 pointer-events-none transition-transform duration-500 group-hover/nav:scale-110">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">
          {/* Aro do Relógio */}
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
          <circle cx="12" cy="12" r="0.6" fill="currentColor" />
          
          {/* Ponteiro das Horas - Envolvido em <motion.g> para não saltar */}
          <motion.g
            animate={{ rotate: activePhaseIndex * 30 }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            style={{ originX: "12px", originY: "12px" }}
          >
            <line x1="12" y1="12" x2="12" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </motion.g>
          
          {/* Ponteiro dos Minutos - Envolvido em <motion.g> para não saltar */}
          <motion.g
            animate={{ rotate: activePhaseIndex * 360 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ originX: "12px", originY: "12px" }}
          >
            <line x1="12" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </motion.g>
        </svg>
      </div>

      {/* SETA DIREITA */}
      <button 
        onClick={() => goToPhase(activePhaseIndex + 1)} 
        onMouseEnter={() => setIsHovering(true)} 
        onMouseLeave={() => setIsHovering(false)} 
        className="flex items-center justify-center h-full outline-none group/btnr cursor-none border-l border-white/5"
      >
        <ChevronRight 
          size={22} 
          strokeWidth={1} 
          className="text-white/30 group-hover/btnr:text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all" 
        />
      </button>
    </motion.div>
  );
}