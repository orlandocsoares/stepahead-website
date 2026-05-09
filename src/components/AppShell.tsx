"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Nuvem%20LooP/";
const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 280;

// As Paragens Estratégicas (Fases da Hero)
const FOCUS_FRAMES = [8, 39, 66, 86, 151, 210, 260];
const PAUSE_DURATION_MS = 6000; // 6 segundos de descanso visual na Dashboard

export function AppShell({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith("/dashboard");
  const isDashboardRef = useRef(isDashboard);

  // Mantém a referência da rota actualizada dentro do motor de animação
  useEffect(() => {
    isDashboardRef.current = isDashboard;
  }, [isDashboard]);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Regressamos ao desenho NÍTIDO de frame único para eliminar a fadiga visual
    const draw = (img: HTMLImageElement) => {
      const cw = window.innerWidth, ch = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      
      canvas.width = cw * dpr; 
      canvas.height = ch * dpr; 
      ctx.scale(dpr, dpr);
      
      const imgRatio = img.naturalWidth / img.naturalHeight, canvasRatio = cw / ch;
      let rW, rH, oX, oY;
      
      if (canvasRatio > imgRatio) { 
        rW = cw; rH = cw / imgRatio; oX = 0; oY = (ch - rH) / 2; 
      } else { 
        rW = ch * imgRatio; rH = ch; oX = (cw - rW) / 2; oY = 0; 
      }

      ctx.drawImage(img, oX, oY, rW, rH);
    };

    // Pré-carregamento das imagens
    for (let i = 0; i < TOTAL_FRAMES_COUNT; i++) {
      const img = new Image();
      img.src = `${BASE_FRAME_URL}frame_${i.toString().padStart(3, "0")}${FRAME_SUFFIX}`;
      imagesRef.current[i] = img;
      
      if (i === 0) {
        img.onload = () => draw(img);
      }
    }

    let currentFrameFloat = 0;
    let isPaused = false;
    let pauseStart = 0;
    let targetPhaseIndex = 0;

    const handleResize = () => {
      const currentIdx = Math.floor(currentFrameFloat);
      const img = imagesRef.current[currentIdx];
      if (img?.complete) draw(img);
    };
    
    window.addEventListener("resize", handleResize);

    const animateBackground = (timestamp: number) => {
      if (isDashboardRef.current) {
        // LÓGICA DA DASHBOARD: Transição suave com Estações de Repouso Premium
        if (isPaused) {
          if (timestamp - pauseStart > PAUSE_DURATION_MS) {
            isPaused = false;
            targetPhaseIndex = (targetPhaseIndex + 1) % FOCUS_FRAMES.length;
          }
        } else {
          const targetFrame = FOCUS_FRAMES[targetPhaseIndex];
          let dist = targetFrame - currentFrameFloat;
          if (dist < 0) dist += TOTAL_FRAMES_COUNT;

          // Velocidade base aumentada (1.5x mais rápida) para evitar o arrasto visual
          let currentSpeed = 0.08;

          // EFEITO PREMIUM: Mantém a velocidade alta, e a 2 frames do destino trava abruptamente
          if (dist < 2) {
            currentSpeed = Math.max(0.02, dist * 0.4);
          }

          if (dist <= currentSpeed) {
            currentFrameFloat = targetFrame;
            isPaused = true;
            pauseStart = timestamp;
          } else {
            currentFrameFloat += currentSpeed;
            if (currentFrameFloat >= TOTAL_FRAMES_COUNT) {
              currentFrameFloat -= TOTAL_FRAMES_COUNT;
            }
          }
        }
      } else {
        // LÓGICA DA HERO: Rotação fluida e em velocidade normal (1)
        currentFrameFloat += 1;
        if (currentFrameFloat >= TOTAL_FRAMES_COUNT) {
          currentFrameFloat -= TOTAL_FRAMES_COUNT;
        }
      }

      const currentIdx = Math.floor(currentFrameFloat);
      const img = imagesRef.current[currentIdx];
      
      if (img?.complete) {
        draw(img);
      }

      animationId = requestAnimationFrame(animateBackground);
    };
    
    // Passamos o timestamp do navegador para iniciar o ciclo
    animationId = requestAnimationFrame(animateBackground);

    return () => { 
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full contrast-115 saturate-110 brightness-95 transform-gpu" />
        
        {/* NOVA CAMADA GLASS: Opacidade aumentada (bg-black/35) e desfoque a 8px.
            Proporciona um descanso ocular profundo na Dashboard. */}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[8px] pointer-events-none transition-all duration-1000" />
        
        {/* Gradiente original mantido intacto */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      </div>
      {children}
    </>
  );
}