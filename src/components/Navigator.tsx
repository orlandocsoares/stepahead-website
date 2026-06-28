"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSound } from "@/hooks/useSound";

interface NavigatorProps {
  activePhaseIndex: number;
  goToPhase: (index: number) => void;
  setIsHovering: (hovering: boolean) => void;
}

export function Navigator({ activePhaseIndex, goToPhase, setIsHovering }: NavigatorProps) {
  const { playSound } = useSound();
  const totalPhases = 7;
  const progress = activePhaseIndex / (totalPhases - 1);
  const strokeDasharray = 113;

  const handleNavigate = (direction: "next" | "prev") => {
    playSound("click");
    if (direction === "next") goToPhase(activePhaseIndex + 1);
    else goToPhase(activePhaseIndex - 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative hidden md:grid w-44 md:w-64 h-14 md:h-16 rounded-2xl border border-white/10 grid-cols-[1fr,auto,1fr] items-center pointer-events-auto bg-black/20 backdrop-blur-3xl shadow-2xl overflow-hidden"
    >
      <button 
        onClick={() => handleNavigate("prev")} 
        onMouseEnter={() => { setIsHovering(true); playSound("hover"); }} 
        onMouseLeave={() => setIsHovering(false)} 
        className="flex items-center justify-center h-full group/btn cursor-none border-r border-white/5 hover:bg-white/[0.02] transition-all"
      >
        <ChevronLeft size={18} className="text-white/20 group-hover/btn:text-white transition-colors" />
      </button>

      <div className="relative flex items-center justify-center w-16 h-full px-4">
        <svg width="40" height="40" viewBox="0 0 40 40" className="transform -rotate-90">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" className="text-white/5" fill="none" />
          <motion.circle 
            cx="20" cy="20" r="18" stroke="white" strokeWidth="1.5" fill="none" 
            strokeDasharray={strokeDasharray}
            animate={{ strokeDashoffset: strokeDasharray - (strokeDasharray * progress) }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute top-2 w-[1.5px] h-3 bg-white shadow-[0_0_10px_white] rounded-full z-20" />
          <div className="w-1 h-1 bg-white/20 rounded-full" />
        </div>
      </div>

      <button 
        onClick={() => handleNavigate("next")} 
        onMouseEnter={() => { setIsHovering(true); playSound("hover"); }} 
        onMouseLeave={() => setIsHovering(false)} 
        className="flex items-center justify-center h-full group/btn cursor-none border-l border-white/5 hover:bg-white/[0.02] transition-all"
      >
        <ChevronRight size={18} className="text-white/20 group-hover/btn:text-white transition-colors" />
      </button>
    </motion.div>
  );
}