"use client";

import { useEffect, useState, useRef } from "react";
import { PROGRAM_PHASES, DASHBOARD_URL, BASE_FRAME_URL, TOTAL_FRAMES } from "@/lib/program-config";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  // --- MOTOR MATEIGA PURA (CANVAS) ---
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Mapeia o scroll (0 a 1) para o número do frame (0 a 99)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  // Função de URL ajustada para o formato que funciona: frame_00_delay-0.042s.webp
  const getUrl = (index: number) => {
    const padded = index.toString().padStart(2, "0");
    return `${BASE_FRAME_URL}frame_${padded}_delay-0.042s.webp`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Resolução HD Fixa (Melhor performance)
    canvas.width = 1280;
    canvas.height = 720;

    const preloadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    const preloadImages = () => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getUrl(i);
        img.onload = () => {
          loadedCount++;
          if (loadedCount === TOTAL_FRAMES) {
            setImagesLoaded(true);
            // Draw first frame
            const firstImg = preloadedImages[0];
            if (context && firstImg && firstImg.complete && firstImg.naturalWidth > 0) {
              context.drawImage(firstImg, 0, 0, canvas.width, canvas.height);
            }
          }
        };
        img.onerror = () => {
            // If an image fails to load, we still increment the counter
            // to prevent the loading screen from getting stuck.
            loadedCount++;
            if (loadedCount === TOTAL_FRAMES) {
                setImagesLoaded(true);
            }
        };
        preloadedImages[i] = img;
      }
    };
    
    preloadImages()

    // 2. Loop de atualização do Canvas
    const unsubscribeFrame = frameIndex.on("change", (latest) => {
      const frameNum = Math.floor(latest);
      const imgFrame = preloadedImages[frameNum];

      // FIX: Check if the image is complete and not broken before drawing
      if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0 && context) {
         context.clearRect(0, 0, canvas.width, canvas.height);
         context.drawImage(imgFrame, 0, 0, canvas.width, canvas.height);
      }
    });

    return () => unsubscribeFrame();
  }, [frameIndex]);

  // Controlo manual das fases (Clicar nas setas)
  const nextPhase = () => setActivePhaseIndex((prev) => (prev + 1) % PROGRAM_PHASES.length);
  const prevPhase = () => setActivePhaseIndex((prev) => (prev - 1 + PROGRAM_PHASES.length) % PROGRAM_PHASES.length);
  const currentPhase = PROGRAM_PHASES[activePhaseIndex];

  return (
    // Aumentei para 500vh para a animação ser suave. 200vh é muito rápido para 100 frames.
    <div ref={containerRef} className="relative h-[500vh] w-full bg-black">
      
      {!imagesLoaded && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse text-white">
            Sincronizando
          </p>
        </div>
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* CAMADA 0: O CANVAS (O MOTOR) */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* CAMADA 1: CONTEÚDO E NAVEGAÇÃO */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-12 md:px-24 pb-16">
          {/* Lado Esquerdo: Conteúdo do Texto */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg space-y-4 pointer-events-auto"
            >
              <p className="font-bold text-[10px] tracking-[0.5em] text-white/70 uppercase">{currentPhase.subtitle}</p>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.8] text-white drop-shadow-lg">
                {currentPhase.name}
              </h1>
              <p className="text-base text-white/80 max-w-sm leading-relaxed font-medium">
                {currentPhase.description}
              </p>
              
              <div className="pt-6 flex gap-4">
                <Button asChild size="lg" className="bg-white text-black rounded-none px-12 h-12 font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform hover:bg-gray-200">
                  <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">Aceder</a>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white bg-transparent rounded-none px-12 h-12 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
                  Conhecer o Programa
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Lado Direito: Indicador de Fase */}
          <div className="flex flex-col items-end gap-6">
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter text-white/30 italic">{currentPhase.index}</span>
                <span className="text-[10px] font-bold text-white/20">/ 03</span>
              </div>

              <div className="flex items-center gap-6 pointer-events-auto">
                <button onClick={prevPhase} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-2">
                  {PROGRAM_PHASES.map((_, i) => (
                    <div 
                      key={i}
                      onClick={() => setActivePhaseIndex(i)}
                      className={`h-[2px] cursor-pointer transition-all duration-500 ${i === activePhaseIndex ? "w-10 bg-white" : "w-3 bg-white/20 hover:bg-white/60"}`}
                    />
                  ))}
                </div>

                <button onClick={nextPhase} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
