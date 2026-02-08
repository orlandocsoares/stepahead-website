"use client";

import { useEffect, useState, useRef } from "react";
import { PROGRAM_PHASES, DASHBOARD_URL, BASE_FRAME_URL } from "@/lib/program-config";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  
  const totalFrames = 192;

  const getFrameUrl = (index: number) => {
    const num = Math.floor(index).toString().padStart(3, '0');
    return `${BASE_FRAME_URL}frame_${num}_delay-0.041s.webp`;
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 25,
    restDelta: 0.001
  });

  const frameIndex = useTransform(smoothProgress, [0, 1], [0, totalFrames - 1]);

  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      setCurrentFrame(Math.round(latest));
    });

    let count = 0;
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        count++;
        if (count === totalFrames) setImagesLoaded(true);
      };
      img.onerror = () => { count++; if (count === totalFrames) setImagesLoaded(true); };
    }
    return () => unsubscribe();
  }, [frameIndex]);

  const nextPhase = () => setActivePhaseIndex((prev) => (prev + 1) % PROGRAM_PHASES.length);
  const prevPhase = () => setActivePhaseIndex((prev) => (prev - 1 + PROGRAM_PHASES.length) % PROGRAM_PHASES.length);

  const currentPhase = PROGRAM_PHASES[activePhaseIndex];

  return (
    // Reduzi para h-[200vh] para o scroll ser mais direto e sem folgas
    <div ref={containerRef} className="h-[200vh] relative w-full bg-white">
      {!imagesLoaded && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Sincronizando Experiência</p>
        </div>
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Camada WebP - Cor Original e Sem Camadas por cima */}
        <div className="absolute inset-0 z-0">
          <img
            src={getFrameUrl(currentFrame)}
            alt="Sequence"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Textos - Alinhados à Esquerda/Baixo */}
        <div className="relative z-10 h-full flex flex-col items-start justify-end pb-32 px-12 md:px-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl space-y-6"
            >
              <p className="font-bold text-[10px] tracking-[0.5em] text-black uppercase">{currentPhase.subtitle}</p>
              <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-black drop-shadow-sm">{currentPhase.name}</h1>
              <p className="text-lg text-black/80 max-w-sm leading-relaxed font-medium">{currentPhase.description}</p>
              <div className="pt-4 flex gap-4">
                <Button asChild size="lg" className="bg-black text-white rounded-none px-12 h-12 font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">
                  <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">Aceder</a>
                </Button>
                <Button variant="outline" size="lg" className="border-black text-black rounded-none px-12 h-12 font-bold uppercase text-[10px] tracking-widest hover:bg-black/5 transition-all">
                  Conhecer o Programa
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicador Discreto */}
        <div className="absolute right-12 md:right-32 bottom-32 z-20 flex flex-col items-end gap-6">
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tighter text-black/20 italic">{currentPhase.index}</span>
              <span className="text-[10px] font-bold text-black/10">/ 03</span>
            </div>

            <div className="flex items-center gap-6 bg-white/60 backdrop-blur-md p-2 rounded-full border border-black/10">
              <button onClick={prevPhase} className="p-2 hover:bg-black/10 rounded-full transition-colors text-black/40 hover:text-black">
                <ChevronLeft size={20} />
              </button>

              <div className="flex gap-2">
                {PROGRAM_PHASES.map((_, i) => (
                  <div 
                    key={i}
                    onClick={() => setActivePhaseIndex(i)}
                    className={`h-[2px] cursor-pointer transition-all duration-500 ${i === activePhaseIndex ? "w-10 bg-black/60" : "w-3 bg-black/20 hover:bg-black/40"}`}
                  />
                ))}
              </div>

              <button onClick={nextPhase} className="p-2 hover:bg-black/10 rounded-full transition-colors text-black/40 hover:text-black">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
