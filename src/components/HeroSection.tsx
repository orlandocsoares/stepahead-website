"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { DASHBOARD_URL, BASE_FRAME_URL, TOTAL_FRAMES } from "@/lib/program-config";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [phases, setPhases] = useState<any[]>([]);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 120, damping: 20 });
  const frameIndex = useTransform(smoothProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

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
      context.imageSmoothingQuality = "high";

      const currentFrame = Math.floor(frameIndex.get());
      const img = imagesRef.current[currentFrame];
      if (img && img.complete) {
        drawFrame(img, context, canvas.width / dpr, canvas.height / dpr);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const padded = i.toString().padStart(2, "0");
      img.src = `${BASE_FRAME_URL}frame_${padded}_delay-0.042s.webp`;
      imagesRef.current[i] = img;
      img.onload = () => { if (i === 0) handleResize(); };
    }

    const unsubscribeScroll = frameIndex.on("change", (v) => {
      const img = imagesRef.current[Math.floor(v)];
      if (img && canvas && context) {
         const width = canvas.width / (window.devicePixelRatio || 1);
         const height = canvas.height / (window.devicePixelRatio || 1);
         drawFrame(img, context, width, height);
      }
    });
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      unsubscribeScroll();
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
    <div ref={containerRef} className="relative h-[300vh] w-full bg-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden text-left">
        
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full contrast-110 saturate-125 brightness-105" />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-end px-16 md:px-40 pb-20 md:pb-28 pointer-events-none">
          <div className="flex justify-between items-end w-full max-w-[1800px] mx-auto">
            
            <div className="max-w-md pointer-events-auto">
              <AnimatePresence mode="wait">
                {currentPhase && (
                  <motion.div key={currentPhase.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] tracking-[0.6em] text-black/40 uppercase font-bold italic">{currentPhase.subtitle}</p>
                      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black/90 leading-none">{currentPhase.name}</h1>
                    </div>
                    <p className="text-sm text-black/60 leading-relaxed font-medium italic">{currentPhase.description}</p>
                    
                    <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-4 pt-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/80 group-hover:text-black transition-all">sabermais</span>
                      <div className="h-[1px] w-6 bg-black/20 group-hover:w-10 group-hover:bg-black transition-all duration-500" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {phases.length > 0 && (
              <div className="flex flex-col items-center gap-4 pointer-events-auto">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black/20">Fase</span>
                  <span className="text-sm font-bold text-black/40 tabular-nums">{currentPhase?.phase_index}</span>
                </div>
                
                <div className="relative h-24 w-[2px] bg-black/10 overflow-hidden">
                  <motion.div animate={{ height: `${((activePhaseIndex + 1) / phases.length) * 100}%` }} className="absolute top-0 w-full bg-black/60 transition-all duration-1000" />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-black/20 tabular-nums">0{phases.length}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black/10">Total</span>
                </div>
                
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => setActivePhaseIndex((p) => (p - 1 + phases.length) % phases.length)} className="p-2 text-black/30 hover:text-black transition-colors"><ChevronUp size={16} /></button>
                  <button onClick={() => setActivePhaseIndex((p) => (p + 1) % phases.length)} className="p-2 text-black/30 hover:text-black transition-colors"><ChevronDown size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}