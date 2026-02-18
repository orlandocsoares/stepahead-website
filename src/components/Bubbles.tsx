"use client";

import { useIdle } from "@/hooks/use-idle";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const BASE_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/iCons/Icons-";
const TOTAL_ICONS = 26; 

const BUBBLE_TYPES = [
  { type: 'curiosidade', text: "💡 O portal adapta-se ao seu ritmo de exploração.", color: "rgba(255, 255, 255, 0.4)" },
  { type: 'destaque', text: "🔥 Novas atualizações disponíveis.", action: "documents", color: "rgba(239, 68, 68, 0.6)" },
];

class Bubble {
  x: number; y: number; vx: number; vy: number; radius: number; 
  maxRadius: number; img: HTMLImageElement; opacity: number;
  isPopping: boolean = false; fragments: any[] = [];
  content: typeof BUBBLE_TYPES[0];
  
  birth: number;
  lifespan: number;
  seed: number;

  constructor(canvasWidth: number, canvasHeight: number, imgs: any) {
    const rand = Math.random();
    this.content = rand < 0.8 ? BUBBLE_TYPES[0] : BUBBLE_TYPES[1];
    
    const iconId = (Math.floor(Math.random() * TOTAL_ICONS) + 1).toString().padStart(2, "0");
    this.img = imgs[iconId];

    this.x = Math.random() * canvasWidth;
    this.y = canvasHeight + 100;
    
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = -(Math.random() * 0.8 + 0.6); 
    
    this.radius = 2;
    this.maxRadius = Math.random() * 15 + 30;
    this.opacity = 0;
    
    this.birth = Date.now();
    this.lifespan = 6000 + Math.random() * 4000;
    this.seed = Math.random() * 1000;
  }

  update(mouseX: number, mouseY: number, isReturning: boolean) {
    if (this.isPopping) return;

    const age = Date.now() - this.birth;
    
    if (age > this.lifespan && !isReturning) {
      this.pop();
      return;
    }

    this.vx += Math.sin(age * 0.002 + this.seed) * 0.05;
    this.vy += Math.cos(age * 0.002 + this.seed) * 0.03;

    const dx = this.x - mouseX; const dy = this.y - mouseY; const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 300) {
      const force = (300 - dist) / 300; const angle = Math.atan2(dy, dx);
      if (this.content.type === 'curiosidade') { this.vx += Math.cos(angle) * force * 1; this.vy += Math.sin(angle) * force * 1; }
      else { this.vx -= Math.cos(angle) * force * 1.5; this.vy -= Math.sin(angle) * force * 1.5; }
    }
    
    if (isReturning) { 
        this.vy = -12; 
        this.opacity -= 0.08;
    } else { 
        if (this.radius < this.maxRadius) this.radius += 0.25; 
        if (this.opacity < 1) this.opacity += 0.03; 
        
        if (age > this.lifespan - 1000) this.opacity -= 0.02;
    }

    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.99;
  }

  pop() {
    this.isPopping = true;
    for (let i = 0; i < 8; i++) {
      this.fragments.push({ 
        x: this.x, y: this.y, 
        vx: (Math.random() - 0.5) * 15, 
        vy: (Math.random() - 0.5) * 15, 
        size: this.radius / 5, life: 1 
      });
    }
  }
}

export function Bubbles() {
  const isIdle = useIdle(10000);
  const [sessionActive, setSessionActive] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const mousePos = useRef({ x: -2000, y: -2000 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const smoothCursorX = useSpring(cursorX, { damping: 40, stiffness: 200 });
  const smoothCursorY = useSpring(cursorY, { damping: 40, stiffness: 200 });

  useEffect(() => {
    setIsMounted(true);
    const imgs: Record<string, HTMLImageElement> = {};
    for (let i = 1; i <= TOTAL_ICONS; i++) {
      const id = i.toString().padStart(2, "0");
      const img = new Image(); img.src = `${BASE_URL}${id}.png`; imgs[id] = img;
    }
    setLoadedImages(imgs);
  }, []);

  useEffect(() => { if (isIdle && isMounted) setSessionActive(true); }, [isIdle, isMounted]);

  useEffect(() => {
    const handleExit = () => {
      if (sessionActive && !isReturning) {
        setIsReturning(true);
        setTimeout(() => { setIsReturning(false); setSessionActive(false); bubblesRef.current = []; }, 800);
      }
    };
    const detectAction = (e: MouseEvent) => {
      cursorX.set(e.clientX); cursorY.set(e.clientY);
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const speed = Math.sqrt(dx*dx + dy*dy);
      
      if (speed > 350 && sessionActive && !isReturning) handleExit();
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    if (sessionActive) window.addEventListener("mousemove", detectAction);
    return () => window.removeEventListener("mousemove", detectAction);
  }, [sessionActive, isReturning]);

  useEffect(() => {
    if (!sessionActive || !isMounted || Object.keys(loadedImages).length === 0) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let frame: number;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isReturning && Math.random() < 0.08 && bubblesRef.current.length < 25) {
        bubblesRef.current.push(new Bubble(canvas.width, canvas.height, loadedImages));
      }

      bubblesRef.current.forEach((b, i) => {
        b.update(mousePos.current.x, mousePos.current.y, isReturning);
        
        if (b.y < -150 || (b.isPopping && b.fragments.length === 0)) {
          bubblesRef.current.splice(i, 1);
        }

        if (b.img.complete && b.img.naturalWidth > 0) {
          if (b.isPopping) {
            b.fragments.forEach((f, fi) => {
              f.x += f.vx; f.y += f.vy; f.vy += 0.4; f.life -= 0.04;
              ctx.globalAlpha = f.life; ctx.drawImage(b.img, f.x, f.y, f.size, f.size);
              if (f.life <= 0) b.fragments.splice(fi, 1);
            });
          } else {
            ctx.save(); ctx.globalAlpha = b.opacity; ctx.shadowBlur = 12; ctx.shadowColor = b.content.color;
            ctx.drawImage(b.img, b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2); ctx.restore();
          }
        }
      });
      frame = requestAnimationFrame(loop);
    };
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    loop();
    return () => cancelAnimationFrame(frame);
  }, [sessionActive, isMounted, isReturning, loadedImages]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {sessionActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-white/[0.05] backdrop-blur-[20px] pointer-events-auto cursor-none" 
            onClick={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;
              
              let hit = false;
              bubblesRef.current.forEach(b => {
                const d = Math.sqrt((cx - b.x)**2 + (cy - b.y)**2);
                if (d < b.radius + 25 && !b.isPopping) { 
                  b.pop(); hit = true;
                  setActiveItem(b.content); 
                  setTimeout(() => setActiveItem(null), 3500); 
                }
              });

              if (!hit && !isReturning) {
                 setIsReturning(true);
                 setTimeout(() => { setIsReturning(false); setSessionActive(false); bubblesRef.current = []; }, 800);
              }
            }}>
            
            <canvas ref={canvasRef} className="w-full h-full" />

            <motion.div style={{ x: smoothCursorX, y: smoothCursorY }} className="fixed top-0 left-0 w-10 h-10 -ml-5 -mt-5 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[1px] h-full bg-black/10" />
              <div className="absolute h-[1px] w-full bg-black/10" />
              <div className="w-1 h-1 bg-black/40 rounded-full" />
            </motion.div>

            <AnimatePresence>
              {activeItem && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-3xl p-7 rounded-[2.5rem] shadow-2xl border border-white/50 text-center min-w-[340px]">
                  <p className="text-[9px] font-black uppercase tracking-[0.8em] text-black/20 mb-2">{activeItem.type}</p>
                  <p className="text-xl font-bold text-black leading-tight tracking-tight">{activeItem.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
