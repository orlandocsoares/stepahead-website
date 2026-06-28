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
    <>
      <style>{`
        @keyframes border-spin {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .border-spin {
          animation: border-spin 2.8s linear infinite;
          background: conic-gradient(
            from var(--angle),
            transparent 70%,
            rgba(255,255,255,0.9) 85%,
            rgba(255,255,255,1) 90%,
            rgba(255,255,255,0.9) 95%,
            transparent 100%
          );
        }
      `}</style>

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
              {/* Luz a correr à volta — só no activo */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute -inset-[1.5px] rounded-xl border-spin z-0 pointer-events-none"
                    style={{ borderRadius: "0.75rem" }}
                  />
                )}
              </AnimatePresence>

              {/* Fundo vidro (cobre o gradiente rotativo, deixa só a borda visível) */}
              <div className={`
                absolute inset-[1.5px] rounded-[10px] backdrop-blur-xl transition-all duration-700 z-10
                ${isActive
                  ? "bg-slate-950/80"
                  : "bg-white/[0.04] group-hover:bg-white/[0.10]"}
              `} />

              {/* Borda subtil no hover */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/25 transition-all duration-700 z-10 pointer-events-none" />
              )}

              {/* Texto */}
              <span
                className={`
                  relative z-20 text-[11px] md:text-[12px] uppercase tracking-[0.55em] md:tracking-[0.6em] font-medium font-sans
                  leading-none transition-all duration-700 truncate px-4
                  ${isActive
                    ? "text-white font-bold"
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
    </>
  );
}
