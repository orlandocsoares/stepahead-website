
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DASHBOARD_URL } from "@/lib/program-config";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Mouse } from "lucide-react";

const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Nuvem%20LooP/";
const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 280;

const PROGRAM_PHASES = [
  {
    id: "fase-1",
    focusFrame: 5, 
    subtitle: "III Ciclo - Angola",
    name: "Saber Mais",
    description: "Programa de Cooperação Bilateral entre Portugal e Angola, tutelado pelo Camões, I.P. e pelo Ministério da Educação de Angola-INFQE."
  },
  {
    id: "fase-2",
    focusFrame: 86, 
    subtitle: "Objetivo Geral",
    name: "Capacitação",
    description: "Capacitar e valorizar os recursos humanos do sistema educativo angolano, priorizando os agentes do Ensino Secundário Pedagógico."
  },
  {
    id: "fase-3", 
    focusFrame: 154, 
    subtitle: "Modelo de Supervisão",
    name: "Par Pedagógico",
    description: "Promoção da supervisão em modelo de par pedagógico e a institucionalização de Centros de Recursos nas comunidades."
  },
  {
    id: "fase-4", 
    focusFrame: 204, 
    subtitle: "Áreas de Intervenção",
    name: "Disciplinas",
    description: "Reforço de competências em Língua Portuguesa, Matemática, Expressões e Pré-escolar e Necessidades Educativas Especiais."
  }
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  // MOTOR DE POSIÇÃO ABSOLUTA
  const targetFrameValue = useMotionValue(PROGRAM_PHASES[0].focusFrame);
  const progressBarHeight = useMotionValue("25%");
  
  // FÍSICA DE PARAGEM BRUSCA
  const smoothFrame = useSpring(targetFrameValue, { 
    mass: 3.0,       
    stiffness: 45,   
    damping: 35,     
    restDelta: 0.001 
  });

  const isCooldown = useRef(false);
  const scrollIntent = useRef(0);

  // FUNÇÃO DE NAVEGAÇÃO SEGURA
  const goToPhase = useCallback((index: number) => {
    if (isCooldown.current) return;
    if (!hasInteracted) setHasInteracted(true);

    const nextIndex = (index + PROGRAM_PHASES.length) % PROGRAM_PHASES.length;
    
    isCooldown.current = true;
    setTimeout(() => { isCooldown.current = false; }, 800);

    setActivePhaseIndex(nextIndex);

    const currentFrame = targetFrameValue.get();
    const targetFocus = PROGRAM_PHASES[nextIndex].focusFrame;
    
    let diff = targetFocus - (currentFrame % TOTAL_FRAMES_COUNT);
    if (diff > TOTAL_FRAMES_COUNT / 2) diff -= TOTAL_FRAMES_COUNT;
    if (diff < -TOTAL_FRAMES_COUNT / 2) diff += TOTAL_FRAMES_COUNT;

    targetFrameValue.set(currentFrame + diff);
  }, [activePhaseIndex, hasInteracted, targetFrameValue]);

  // CAPTURA DE SCROLL COM INSISTÊNCIA
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isCooldown.current) return;

      scrollIntent.current += e.deltaY;

      if (scrollIntent.current > 100) {
        goToPhase(activePhaseIndex + 1);
        scrollIntent.current = 0;
      } else if (scrollIntent.current < -100) {
        goToPhase(activePhaseIndex - 1);
        scrollIntent.current = 0;
      }
    };

    const el = containerRef.current;
    el?.addEventListener("wheel", handleWheel, { passive: false });
    return () => el?.removeEventListener("wheel", handleWheel);
  }, [activePhaseIndex, goToPhase]);

  // RENDERIZAÇÃO DO CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = (img: HTMLImageElement) => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = cw / ch;
      let rW, rH, oX, oY;

      if (canvasRatio > imgRatio) {
        rW = cw; rH = cw / imgRatio; oX = 0; oY = (ch - rH) / 2;
      } else {
        rW = ch * imgRatio; rH = ch; oX = (cw - rW) / 2; oY = 0;
      }
      ctx.drawImage(img, oX, oY, rW, rH);
    };

    for (let i = 0; i < TOTAL_FRAMES_COUNT; i++) {
      const img = new Image();
      img.src = `${BASE_FRAME_URL}frame_${i.toString().padStart(3, "0")}${FRAME_SUFFIX}`;
      imagesRef.current[i] = img;
      if (i === 0) img.onload = () => draw(img);
    }

    let lastFrame = -1;
    return smoothFrame.on("change", (v) => {
      let frameIdx = Math.floor(v) % TOTAL_FRAMES_COUNT;
      if (frameIdx < 0) frameIdx += TOTAL_FRAMES_COUNT;

      if (frameIdx !== lastFrame) {
        lastFrame = frameIdx;
        const img = imagesRef.current[frameIdx];
        if (img?.complete && img.naturalHeight > 0) {
          requestAnimationFrame(() => draw(img));
        }
      }
      progressBarHeight.set(`${((activePhaseIndex + 1) / PROGRAM_PHASES.length) * 100}%`);
    });
  }, [smoothFrame, activePhaseIndex, progressBarHeight]);

  return (
    <div 
      ref={containerRef} 
      className="relative h-screen w-full bg-black overflow-hidden touch-none cursor-default"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full contrast-115 saturate-110 brightness-95" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

      {/* LOGOTIPO CENTRALIZADO - Aumentado em 1X (dobro do tamanho anterior) */}
      <div className="absolute bottom-20 md:bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-6 pointer-events-auto w-[450px] md:w-[650px]">
        <img 
          src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Sabermais/Logo%20simples.png" 
          alt="Logotipo Saber Mais" 
          className="h-32 md:h-40 w-auto object-contain cursor-pointer transition-transform duration-700 hover:scale-105 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          onClick={() => goToPhase(0)}
        />
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white text-center leading-relaxed drop-shadow-[0_2px_5px_rgba(0,0,0,1)] opacity-90">
          Programa de Apoio ao Reforço do Ensino Secundário em Angola
        </p>
      </div>

      {/* AVISO DE INTERAÇÃO */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
          >
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="flex flex-col items-center gap-2 text-white/30">
              <Mouse size={24} strokeWidth={1} />
              <span className="text-[8px] font-bold uppercase tracking-[0.5em]">Scroll to Explore</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="absolute top-0 left-0 w-full z-30 px-16 md:px-40 py-12 flex justify-between items-center pointer-events-none">
        <div className="w-32" />
        <nav className="hidden md:flex gap-16 pointer-events-auto pt-[10px]">
          {PROGRAM_PHASES.map((phase, index) => (
            <button
              key={phase.id}
              onClick={() => goToPhase(index)}
              className={`flex items-baseline gap-3 transition-all duration-700 group ${
                activePhaseIndex === index ? "scale-105" : "hover:scale-105"
              }`}
            >
              <span className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                activePhaseIndex === index ? "text-white drop-shadow-[0_0_8px_white]" : "text-white/20 group-hover:text-white/40"
              }`}>
                0{index + 1}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-all duration-500 ${
                activePhaseIndex === index ? "text-white opacity-100" : "text-white/0 opacity-0 group-hover:text-white/20 group-hover:opacity-100"
              }`}>
                {phase.name}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {/* CONTEÚDO DESCRITIVO */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-16 md:px-40 pb-0 pointer-events-none">
        <div className="flex justify-between items-end w-full max-w-[1800px] mx-auto relative h-full">
          
          <div className="absolute bottom-[30vh] lg:bottom-[35vh] left-0 max-w-xl pointer-events-none w-full h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activePhaseIndex}
                initial={{ opacity: 0, y: 40, filter: "blur(15px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -40, filter: "blur(15px)" }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} 
                className="absolute top-[-10px] left-0 w-full flex flex-col gap-6 pointer-events-auto"
              >
                <div className="space-y-2">
                  <p className="text-[11px] tracking-[0.8em] text-white/40 uppercase font-bold italic">{PROGRAM_PHASES[activePhaseIndex].subtitle}</p>
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white leading-[0.8] drop-shadow-2xl">{PROGRAM_PHASES[activePhaseIndex].name}</h1>
                </div>
                <p className="text-base text-white/60 leading-relaxed font-medium italic max-w-sm border-l border-white/20 pl-6">{PROGRAM_PHASES[activePhaseIndex].description}</p>
                <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-6 pt-6 cursor-pointer w-fit">
                  <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 group-hover:bg-white transition-all duration-700" />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/80 group-hover:text-white transition-all">Saber Mais</span>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-[30vh] lg:bottom-[35vh] right-0 flex flex-col items-center gap-10 pointer-events-auto">
            <div className="flex flex-col items-center gap-4">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Phase</span>
              <div className="relative h-48 w-[1px] bg-white/5">
                <motion.div style={{ height: progressBarHeight }} className="absolute top-0 w-full bg-white shadow-[0_0_20px_white] transition-all duration-1000 ease-out" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => goToPhase(activePhaseIndex - 1)} className="p-4 bg-white/5 rounded-full text-white/20 hover:text-white hover:bg-white/10 transition-all"><ChevronUp size={20} /></button>
              <button onClick={() => goToPhase(activePhaseIndex + 1)} className="p-4 bg-white/5 rounded-full text-white/20 hover:text-white hover:bg-white/10 transition-all"><ChevronDown size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
