"use client";

import { useEffect, useState, useRef } from "react";
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

  // MOTOR VIRTUAL INFINITO
  const targetFrameRef = useRef(PROGRAM_PHASES[0].focusFrame);
  const progressRaw = useMotionValue(PROGRAM_PHASES[0].focusFrame);
  const progressBarHeight = useMotionValue("0%");
  
  // FÍSICA CINEMATOGRÁFICA (Pesada no início, paragem firme no fim)
  const smoothFrame = useSpring(progressRaw, { 
    mass: 2.5,       // Muito pesado = Arranque dramático e lento
    stiffness: 80,   // Força de atração alta para a frame destino
    damping: 45,     // Amortecimento alto = Paragem brusca, sem ressaltos
    restDelta: 0.001 
  });

  const getActualFrame = (infiniteFrame: number) => {
    let f = Math.floor(infiniteFrame) % TOTAL_FRAMES_COUNT;
    if (f < 0) f += TOTAL_FRAMES_COUNT;
    return f;
  };

  // ESTADOS DE CONTROLO FIRME
  const scrollIntent = useRef(0);
  const isCooldown = useRef(false);
  const intentTimeout = useRef<NodeJS.Timeout | null>(null);

  const scrollToPhase = (direction: 'next' | 'prev' | number) => {
    if (!hasInteracted) setHasInteracted(true);
    
    // BLOQUEIO ALARGADO: 1.5s para a transição épica respirar
    isCooldown.current = true;
    setTimeout(() => { isCooldown.current = false; }, 1500);

    let nextActive = activePhaseIndex;
    let diff = 0;

    if (direction === 'next') {
      nextActive = (activePhaseIndex + 1) % PROGRAM_PHASES.length;
      const currentFocus = PROGRAM_PHASES[activePhaseIndex].focusFrame;
      const nextFocus = PROGRAM_PHASES[nextActive].focusFrame;
      diff = nextFocus - currentFocus;
      if (diff <= 0) diff += TOTAL_FRAMES_COUNT; 
    } else if (direction === 'prev') {
      nextActive = (activePhaseIndex - 1 + PROGRAM_PHASES.length) % PROGRAM_PHASES.length;
      const currentFocus = PROGRAM_PHASES[activePhaseIndex].focusFrame;
      const prevFocus = PROGRAM_PHASES[nextActive].focusFrame;
      diff = currentFocus - prevFocus;
      if (diff <= 0) diff += TOTAL_FRAMES_COUNT;
      diff = -diff; 
    } else {
      nextActive = direction;
      const targetFocus = PROGRAM_PHASES[nextActive].focusFrame;
      const currentActual = getActualFrame(targetFrameRef.current);
      diff = targetFocus - currentActual;
      if (diff > TOTAL_FRAMES_COUNT / 2) diff -= TOTAL_FRAMES_COUNT;
      if (diff < -TOTAL_FRAMES_COUNT / 2) diff += TOTAL_FRAMES_COUNT;
    }

    setActivePhaseIndex(nextActive);
    targetFrameRef.current += diff;
    progressRaw.set(targetFrameRef.current);
  };

  // NAVEGAÇÃO RODA DO RATO
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isCooldown.current) return; 

      scrollIntent.current += e.deltaY;

      if (scrollIntent.current > 120) { 
        scrollToPhase('next');
        scrollIntent.current = 0;
      } else if (scrollIntent.current < -120) {
        scrollToPhase('prev');
        scrollIntent.current = 0;
      }

      if (intentTimeout.current) clearTimeout(intentTimeout.current);
      intentTimeout.current = setTimeout(() => {
        scrollIntent.current = 0;
      }, 300);
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => element?.removeEventListener('wheel', handleWheel);
  }, [activePhaseIndex, hasInteracted]);

  // NAVEGAÇÃO TOUCH / SWIPE
  const isDragging = useRef(false);
  const startY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCooldown.current) return;
    isDragging.current = true;
    startY.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || isCooldown.current) return;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current || isCooldown.current) return;
    isDragging.current = false;
    
    const dy = startY.current - e.clientY;
    if (dy > 80) scrollToPhase('next');
    else if (dy < -80) scrollToPhase('prev');
  };

  // RENDERIZAÇÃO DO CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    
    const getDpr = () => Math.min(window.devicePixelRatio || 1, 1.5);

    const handleResize = () => {
      const dpr = getDpr(); 
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      context.scale(dpr, dpr);
      context.imageSmoothingEnabled = true;

      const actualFrame = getActualFrame(smoothFrame.get());
      const img = imagesRef.current[actualFrame];
      if (img?.complete) draw(img, context);
    };

    const draw = (img: HTMLImageElement, ctx: CanvasRenderingContext2D) => {
      const cw = window.innerWidth; const ch = window.innerHeight;
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
      img.decode().then(() => {
        imagesRef.current[i] = img;
        if (i === 0) handleResize();
      }).catch(() => {
        imagesRef.current[i] = img;
      });
    }

    let animationFrameId: number;
    let lastDrawnFrame = -1;

    const unsubscribe = smoothFrame.on("change", (v) => {
      const actualFrame = getActualFrame(v);
      
      if (actualFrame !== lastDrawnFrame) {
        lastDrawnFrame = actualFrame;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        animationFrameId = requestAnimationFrame(() => {
          const img = imagesRef.current[actualFrame];
          if (img?.complete && context) draw(img, context);
        });
      }

      progressBarHeight.set(`${(activePhaseIndex / (PROGRAM_PHASES.length - 1)) * 100}%`);
    });
    
    window.addEventListener('resize', handleResize);
    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [smoothFrame, activePhaseIndex, progressBarHeight]);

  return (
    <div 
      ref={containerRef} 
      className="relative h-screen w-full bg-black overflow-hidden touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full contrast-115 saturate-110 brightness-95 transform-gpu will-change-transform" 
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

      {/* LOGOTIPO NO TOPO (CONTRASTE DINÂMICO MAGIC) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto mix-blend-difference">
        <img 
          src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Sabermais/Logo%20simples.png" 
          alt="Logotipo Saber Mais" 
          className="h-24 md:h-32 w-auto object-contain cursor-pointer transition-transform duration-700 hover:scale-105 opacity-90 hover:opacity-100"
          onClick={() => scrollToPhase(0)}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>

      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-white/40"
            >
              <Mouse size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Scroll to Explore</span>
              <ChevronDown size={14} className="mt-[-4px]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="absolute bottom-0 left-0 w-full z-30 px-16 md:px-40 py-12 flex justify-between items-center pointer-events-none">
        <div className="hidden md:block w-32"></div>

        <nav className="hidden md:flex gap-10 pointer-events-auto">
          {PROGRAM_PHASES.map((phase, index) => (
            <button
              key={`header-${phase.id}`}
              onClick={() => scrollToPhase(index)}
              className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] transition-all duration-500 hover:text-white ${
                activePhaseIndex === index ? "text-white scale-105" : "text-white/30"
              }`}
            >
              <span className={`text-[8px] transition-all duration-500 ${activePhaseIndex === index ? "text-white/60" : "text-white/20"}`}>
                0{index + 1}
              </span>
              {phase.name}
            </button>
          ))}
        </nav>
      </header>

      <div className="absolute inset-0 z-20 flex flex-col justify-end px-16 md:px-40 pb-24 pointer-events-none">
        <div className="flex justify-between items-end w-full max-w-[1800px] mx-auto relative h-full">
          
          <div className="absolute bottom-0 left-0 max-w-xl pointer-events-none w-full h-[300px]">
            <AnimatePresence>
              {PROGRAM_PHASES.map((phase, index) => (
                index === activePhaseIndex && (
                  <motion.div 
                    key={`text-${phase.id}`}
                    // EFEITO BLUR CINEMATOGRÁFICO NAS TRANSIÇÕES
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
                    transition={{ duration: 1.2, ease: [0.25, 1, 0.3, 1] }} // Transição longa e dramática
                    className="absolute bottom-6 left-0 w-full flex flex-col gap-6 pointer-events-auto"
                  >
                    <div className="space-y-2">
                      <p className="text-[11px] tracking-[0.8em] text-white/40 uppercase font-bold italic">
                        {phase.subtitle}
                      </p>
                      <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.85] drop-shadow-2xl">
                        {phase.name}
                      </h1>
                    </div>
                    <p className="text-base text-white/60 leading-relaxed font-medium italic max-w-sm border-l border-white/10 pl-6">
                      {phase.description}
                    </p>
                    
                    <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-6 pt-6 cursor-pointer w-fit">
                      <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 group-hover:bg-white transition-all duration-700" />
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/80 group-hover:text-white transition-all">Explorar Portal</span>
                    </button>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 right-0 flex flex-col items-center gap-8 pointer-events-auto">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Progresso</span>
              <div className="relative h-40 w-[1px] bg-white/10">
                <motion.div 
                  style={{ height: progressBarHeight }} 
                  className="absolute top-0 w-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] origin-top transition-all duration-1000 ease-out" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => scrollToPhase('prev')}
                className="p-3 bg-white/5 rounded-full text-white/30 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                <ChevronUp size={18} />
              </button>
              <button 
                onClick={() => scrollToPhase('next')}
                className="p-3 bg-white/5 rounded-full text-white/30 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
