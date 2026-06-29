"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BASE_FRAME_URL } from "@/lib/program-config";
import { getSavedMode, applyMode, saveMode, MODES, type SiteMode } from "@/lib/site-mode";

const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 280;
const FOCUS_FRAMES = [8, 39, 66, 86, 151, 210, 260];
const PAUSE_DURATION_MS = 6000;

export function AppShell({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const pathname = usePathname();
  const [mode, setMode] = useState<SiteMode>("escuro");

  const isCleanPage = pathname === "/recursos" || pathname?.startsWith("/recursos/");
  const isDashboard = pathname?.startsWith("/dashboard")
    || pathname === "/reset-password"
    || pathname === "/forgot-password"
    || pathname === "/confirm-email";
  const isDashboardRef = useRef(isDashboard);

  // Carregar modo guardado e aplicar
  useEffect(() => {
    const saved = getSavedMode();
    setMode(saved);
    applyMode(saved);
  }, []);

  useEffect(() => {
    isDashboardRef.current = isDashboard;
  }, [isDashboard]);

  // Motor de animação — só corre no modo "escuro"
  useEffect(() => {
    if (mode !== "escuro") return;
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

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

    for (let i = 0; i < TOTAL_FRAMES_COUNT; i++) {
      const img = new Image();
      img.src = `${BASE_FRAME_URL}frame_${i.toString().padStart(3, "0")}${FRAME_SUFFIX}`;
      imagesRef.current[i] = img;
      if (i === 0) img.onload = () => draw(img);
    }

    let currentFrameFloat = 0;
    let isPaused = false;
    let pauseStart = 0;
    let targetPhaseIndex = 0;

    const handleResize = () => {
      const img = imagesRef.current[Math.floor(currentFrameFloat)];
      if (img?.complete) draw(img);
    };
    window.addEventListener("resize", handleResize);

    const animate = (timestamp: number) => {
      if (isDashboardRef.current) {
        if (isPaused) {
          if (timestamp - pauseStart > PAUSE_DURATION_MS) {
            isPaused = false;
            targetPhaseIndex = (targetPhaseIndex + 1) % FOCUS_FRAMES.length;
          }
        } else {
          const targetFrame = FOCUS_FRAMES[targetPhaseIndex];
          let dist = targetFrame - currentFrameFloat;
          if (dist < 0) dist += TOTAL_FRAMES_COUNT;
          let speed = 0.08;
          if (dist < 2) speed = Math.max(0.02, dist * 0.4);
          if (dist <= speed) {
            currentFrameFloat = targetFrame;
            isPaused = true;
            pauseStart = timestamp;
          } else {
            currentFrameFloat += speed;
            if (currentFrameFloat >= TOTAL_FRAMES_COUNT) currentFrameFloat -= TOTAL_FRAMES_COUNT;
          }
        }
      } else {
        currentFrameFloat += 1;
        if (currentFrameFloat >= TOTAL_FRAMES_COUNT) currentFrameFloat -= TOTAL_FRAMES_COUNT;
      }
      const img = imagesRef.current[Math.floor(currentFrameFloat)];
      if (img?.complete) draw(img);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [mode]);

  const changeMode = (newMode: SiteMode) => {
    setMode(newMode);
    saveMode(newMode);
    applyMode(newMode);
  };

  if (isCleanPage) return <>{children}</>;

  const modeConfig = MODES.find(m => m.id === mode) ?? MODES[0];

  return (
    <>
      <div className="fixed inset-0 z-0">
        {/* Animação (escuro) ou imagem estática (outros modos) */}
        {mode === "escuro" ? (
          <canvas ref={canvasRef} className="w-full h-full contrast-115 saturate-110 brightness-95 transform-gpu" />
        ) : (
          <img
            src={modeConfig.thumb}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: mode === "claro" ? "saturate(1.1) brightness(1.05)" : "saturate(1.15) brightness(0.9)" }}
          />
        )}
        {/* Overlay adaptado ao modo */}
        <div className={`absolute inset-0 ${modeConfig.overlay} ${modeConfig.blur} pointer-events-none transition-all duration-1000`} />
        {/* Gradiente de rodapé */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Passa changeMode via contexto para o ModeSelector */}
      <AppShellContext.Provider value={{ mode, changeMode }}>
        {children}
      </AppShellContext.Provider>
    </>
  );
}

// Contexto para partilhar o modo com o ModeSelector
import { createContext, useContext } from "react";

type AppShellCtx = { mode: SiteMode; changeMode: (m: SiteMode) => void };
const AppShellContext = createContext<AppShellCtx>({ mode: "escuro", changeMode: () => {} });
export const useAppMode = () => useContext(AppShellContext);
