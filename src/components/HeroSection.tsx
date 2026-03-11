
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { DASHBOARD_URL } from "@/lib/program-config";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

// Configurações actualizadas: Sequência de Nuvem em Loop
const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Nuvem%20LooP/";
const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 201; // Actualizado para os 201 frames detectados

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [phases, setPhases] = useState<any[]>([]);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Monitorização do Scroll
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  
  // Física de scroll snappy e responsiva
  const smoothProgress = useSpring(scrollYProgress, { 
    mass: 0.05, 
    stiffness: 80, 
    damping: 25,
    restDelta: 0.001 
  });

  // Mapeamento para Loop Eterno: A animação cicla 8 vezes ao longo do scroll da página
  const frameIndex = useTransform(smoothProgress, (v) => {
    const totalCycles = 8; 
    const currentFrame = Math.floor((v * TOTAL_FRAMES_COUNT * totalCycles) % TOTAL_FRAMES_COUNT);
    return currentFrame;
  });

  useEffect(() => {
    const fetchPhases = async () => {
      const { data } = await supabase.from('program_phases').select('*').order('order_index', { ascending: true });
      if (data) setPhases(data);
    };
    fetchPhases();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const handleResize = () => {
      if (!canvas || !context) return;
      const dpr = window.devicePixelRatio || 1; 
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      context.scale(dpr, dpr);
      context.imageSmoothingEnabled = true;

      const currentFrame = Math.floor(frameIndex.get());
      const img = imagesRef.current[currentFrame];
      if (img && img.complete) {
        drawFrame(img, context, canvas.width / dpr, canvas.height / dpr);
      }
    };

    // Pré-carregamento optimizado das 201 imagens
    for (let i = 0; i < TOTAL_FRAMES_COUNT; i++) {
      const img = new Image();
      const padded = i.toString().padStart(3, "0"); 
      img.src = `${BASE_FRAME_URL}frame_${padded}${FRAME_SUFFIX}`;
      imagesRef.current[i] = img;
      img.onload = () => { if (i === 0) handleResize(); };
    }

    let animationFrameId: number;
    const unsubscribeScroll = frameIndex.on("change", (v) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        const img = imagesRef.current[Math.floor(v)];
        if (img && img.complete && canvas && context) {
           const width = canvas.width / (window.devicePixelRatio || 1);
           const height = canvas.height / (window.devicePixelRatio || 1);
           drawFrame(img, context, width, height);
        }
      });
    });
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      unsubscribeScroll();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [frameIndex]);

  const drawFrame = (img: HTMLImageElement, ctx: CanvasRenderingContext2D, cWidth: number, cHeight: number) => {
    ctx.clearRect(0, 0, cWidth, cHeight);
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cWidth / cHeight;
    let renderW, renderH, offsetX, offsetY;
    if (canvasRatio > imgRatio) {
      renderW = cWidth; renderH = cWidth / imgRatio; offsetX = 0; offsetY = (cHeight - renderH) / 2;
    } else {
      renderW = cHeight * imgRatio; renderH = cHeight; offsetX = (cWidth - renderW) / 2; offsetY = 0;
    }
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  };

  const currentPhase = phases[activePhaseIndex];

  return (
    <div ref={containerRef} className="relative h-[1200vh] w-full bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden text-left bg-black">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full contrast-110 saturate-110 brightness-105 transform-gpu will-change-transform" 
        />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-end px-16 md:px-40 pb-24 pointer-events-none">
          <div className="flex justify-between items-end w-full max-w-[1800px] mx-auto">
            
            <div className="max-w-md pointer-events-auto">
              <AnimatePresence mode="wait">
                {currentPhase && (
                  <motion.div key={currentPhase.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] tracking-[0.6em] text-white/50 uppercase font-bold italic">{currentPhase.subtitle}</p>
                      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">{currentPhase.name}</h1>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed font-medium italic">
                      {currentPhase.description}
                    </p>
                    
                    <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-4 pt-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 group-hover:text-white transition-all">sabermais</span>
                      <div className="h-[1px] w-6 bg-white/20 group-hover:w-10 group-hover:bg-white transition-all duration-500" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {phases.length > 0 && (
              <div className="flex flex-col items-center gap-6 pointer-events-auto mb-2">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 italic">Fase</span>
                  <span className="text-sm font-bold text-white/60 tabular-nums">0{activePhaseIndex + 1}</span>
                </div>
                
                <div className="relative h-28 w-[2px] bg-white/10 overflow-hidden">
                  <motion.div 
                    animate={{ height: `${((activePhaseIndex + 1) / phases.length) * 100}%` }} 
                    className="absolute top-0 w-full bg-white transition-all duration-1000" 
                  />
                </div>
                
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => setActivePhaseIndex((p) => (p - 1 + phases.length) % phases.length)} className="p-2 text-white/30 hover:text-white transition-colors"><ChevronUp size={16} /></button>
                  <button onClick={() => setActivePhaseIndex((p) => (p + 1) % phases.length)} className="p-2 text-white/30 hover:text-white transition-colors"><ChevronDown size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
