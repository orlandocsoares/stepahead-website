"use client";

import { useEffect, useState, useRef } from "react";
import { PROGRAM_PHASES } from "@/lib/program-config";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

export function HeroSection() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const phaseCount = PROGRAM_PHASES.length;
      const phaseIndex = Math.min(Math.floor(latest * phaseCount), phaseCount - 1);
      setCurrentPhaseIndex(phaseIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const currentPhase = PROGRAM_PHASES[currentPhaseIndex];

  const goToNext = () => {
    if (!containerRef.current) return;
    const nextIndex = Math.min(currentPhaseIndex + 1, PROGRAM_PHASES.length - 1);
    const windowHeight = window.innerHeight;
    const targetScroll = (nextIndex / PROGRAM_PHASES.length) * (containerRef.current.scrollHeight - windowHeight);
    window.scrollTo({ top: targetScroll + 10, behavior: "smooth" });
  };

  const goToPrev = () => {
    if (!containerRef.current) return;
    const prevIndex = Math.max(currentPhaseIndex - 1, 0);
    const windowHeight = window.innerHeight;
    const targetScroll = (prevIndex / PROGRAM_PHASES.length) * (containerRef.current.scrollHeight - windowHeight);
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="h-[400vh] relative z-0">
      <div className="sticky top-0 h-screen overflow-hidden bg-neutral-100">
        {/* Cinematic Parallax Background */}
        <motion.div 
          style={{ y: backgroundY, scale: backgroundScale }}
          className="absolute inset-0 bg-neutral-200"
        >
          <img
            src={currentPhase.sequenceUrl}
            alt="Sequence Frame"
            className="w-full h-full object-cover grayscale opacity-50 mix-blend-multiply transition-all duration-700"
          />
        </motion.div>

        {/* Overlay Content with Fade Transitions */}
        <div className="relative z-10 h-full flex flex-col items-start justify-center px-12 md:px-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl space-y-6"
            >
              <p className="font-headline text-sm tracking-[0.3em] font-semibold text-black/60 uppercase">
                {currentPhase.subtitle}
              </p>
              <h1 className="text-6xl md:text-8xl font-black leading-none uppercase tracking-tighter">
                {currentPhase.name}
              </h1>
              <p className="text-lg md:text-xl text-black/80 max-w-xl font-body leading-relaxed">
                {currentPhase.description}
              </p>
              <div className="flex flex-wrap gap-4 pt-8">
                <Button size="lg" className="bg-black text-white hover:bg-black/90 rounded-none px-12 text-xs tracking-widest uppercase h-14 font-black">
                  Aceder à Plataforma
                </Button>
                <Button variant="outline" size="lg" className="border-black text-black hover:bg-black/5 rounded-none px-12 text-xs tracking-widest uppercase h-14 font-black">
                  Conhecer o Programa
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Phase Navigation Controls */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={goToPrev}
              disabled={currentPhaseIndex === 0}
              className="p-2 border border-black/20 hover:bg-black hover:text-white transition-all disabled:opacity-10"
            >
              <ChevronUp size={20} />
            </button>
            <motion.span 
              key={currentPhase.index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-headline text-7xl font-black tracking-tighter tabular-nums"
            >
              {currentPhase.index}
            </motion.span>
            <button 
              onClick={goToNext}
              disabled={currentPhaseIndex === PROGRAM_PHASES.length - 1}
              className="p-2 border border-black/20 hover:bg-black hover:text-white transition-all disabled:opacity-10"
            >
              <ChevronDown size={20} />
            </button>
          </div>
          <div className="h-40 w-[2px] bg-black/5 relative">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-black origin-top"
              style={{ scaleY: scrollYProgress }}
            />
          </div>
          <div className="flex flex-col gap-2 font-headline text-[10px] tracking-widest font-bold rotate-90 origin-center whitespace-nowrap opacity-30 select-none">
            PROGRAM SEQUENCE
          </div>
        </div>
      </div>
    </div>
  );
}