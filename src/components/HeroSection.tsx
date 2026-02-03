"use client";

import { useEffect, useState, useRef } from "react";
import { PROGRAM_PHASES } from "@/lib/program-config";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export function HeroSection() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const totalHeight = containerRef.current.scrollHeight - windowHeight;
      const progress = Math.min(Math.max(scrollY / totalHeight, 0), 1);
      
      setScrollProgress(progress);
      
      // Determine current phase based on scroll position
      const phaseCount = PROGRAM_PHASES.length;
      const phaseIndex = Math.min(Math.floor(progress * phaseCount), phaseCount - 1);
      setCurrentPhaseIndex(phaseIndex);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentPhase = PROGRAM_PHASES[currentPhaseIndex];

  const goToNext = () => {
    const nextIndex = Math.min(currentPhaseIndex + 1, PROGRAM_PHASES.length - 1);
    const scrollTarget = (nextIndex / PROGRAM_PHASES.length) * (containerRef.current?.scrollHeight || 0);
    window.scrollTo({ top: scrollTarget, behavior: "smooth" });
  };

  const goToPrev = () => {
    const prevIndex = Math.max(currentPhaseIndex - 1, 0);
    const scrollTarget = (prevIndex / PROGRAM_PHASES.length) * (containerRef.current?.scrollHeight || 0);
    window.scrollTo({ top: scrollTarget, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="parallax-container relative">
      <div className="sticky-hero">
        {/* Cinematic WebP Sequence Background */}
        <div className="absolute inset-0 bg-neutral-200">
          <img
            src={currentPhase.sequenceUrl}
            alt="Sequence Frame"
            className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply"
          />
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 h-full flex flex-col items-start justify-center px-12 md:px-24">
          <div className="max-w-3xl space-y-6">
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
          </div>
        </div>

        {/* Phase Navigation Controls (Right Side) */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={goToPrev}
              disabled={currentPhaseIndex === 0}
              className="p-2 border border-black/20 hover:bg-black hover:text-white transition-colors disabled:opacity-20"
            >
              <ChevronUp size={20} />
            </button>
            <span className="font-headline text-7xl font-black tracking-tighter">
              {currentPhase.index}
            </span>
            <button 
              onClick={goToNext}
              disabled={currentPhaseIndex === PROGRAM_PHASES.length - 1}
              className="p-2 border border-black/20 hover:bg-black hover:text-white transition-colors disabled:opacity-20"
            >
              <ChevronDown size={20} />
            </button>
          </div>
          <div className="h-40 w-px bg-black/10 relative">
            <div 
              className="absolute top-0 left-0 w-full bg-black transition-all duration-300"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>
          <div className="flex flex-col gap-2 font-headline text-[10px] tracking-widest font-black rotate-90 origin-center whitespace-nowrap opacity-40">
            PHASE SEQUENCE
          </div>
        </div>
      </div>
    </div>
  );
}
