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
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  const getUrl = (index: number) => {
    const padded = index.toString().padStart(2, "0");
    return `${BASE_FRAME_URL}frame_${padded}_delay-0.042s.webp`;
  };

  const handleNextPhase = () => {
    setActivePhaseIndex((prevIndex) => (prevIndex + 1) % PROGRAM_PHASES.length);
  };

  const handlePrevPhase = () => {
    setActivePhaseIndex((prevIndex) => (prevIndex - 1 + PROGRAM_PHASES.length) % PROGRAM_PHASES.length);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let loadedCount = 0;
    const preloadImages = () => {
      imagesRef.current = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getUrl(i);
        imagesRef.current[i] = img;
        
        img.onload = () => {
          loadedCount++;
          if (loadedCount === 1) { // Load first frame immediately
            if(imagesRef.current[0].complete && imagesRef.current[0].naturalWidth > 0) {
              context.drawImage(imagesRef.current[0], 0, 0, canvas.width, canvas.height);
            }
            setImagesLoaded(true);
          }
        };
        img.onerror = () => {
          // Silently fail on image load error.
        };
      }
    };
    
    preloadImages();

    const unsubscribeFrame = frameIndex.on("change", (latest) => {
      const frameNum = Math.floor(latest);
      const imgFrame = imagesRef.current[frameNum];

      if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0 && context) {
         context.clearRect(0, 0, canvas.width, canvas.height);
         
         const imgRatio = imgFrame.naturalWidth / imgFrame.naturalHeight;
         const canvasRatio = canvas.width / canvas.height;
         let drawWidth, drawHeight, offsetX, offsetY;

         if (canvasRatio > imgRatio) {
           drawWidth = canvas.width;
           drawHeight = canvas.width / imgRatio;
           offsetX = 0;
           offsetY = (canvas.height - drawHeight) / 2;
         } else {
           drawWidth = canvas.height * imgRatio;
           drawHeight = canvas.height;
           offsetX = (canvas.width - drawWidth) / 2;
           offsetY = 0;
         }
         
         context.drawImage(imgFrame, offsetX, offsetY, drawWidth, drawHeight);
      }
    });

    const handleResize = () => {
        if(canvasRef.current && context) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            const frameNum = Math.floor(frameIndex.get());
            const imgFrame = imagesRef.current[frameNum];
            if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0) {
                const imgRatio = imgFrame.naturalWidth / imgFrame.naturalHeight;
                const canvasRatio = canvasRef.current.width / canvasRef.current.height;
                let drawWidth, drawHeight, offsetX, offsetY;
       
                if (canvasRatio > imgRatio) {
                  drawWidth = canvasRef.current.width;
                  drawHeight = canvasRef.current.width / imgRatio;
                  offsetX = 0;
                  offsetY = (canvasRef.current.height - drawHeight) / 2;
                } else {
                  drawWidth = canvasRef.current.height * imgRatio;
                  drawHeight = canvasRef.current.height;
                  offsetX = (canvas.width - drawWidth) / 2;
                  offsetY = 0;
                }
                context.drawImage(imgFrame, offsetX, offsetY, drawWidth, drawHeight);
            }
        }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribeFrame();
      window.removeEventListener('resize', handleResize);
    };
  }, [frameIndex]);

  const currentPhase = PROGRAM_PHASES[activePhaseIndex];

  return (
    <div ref={containerRef} className="relative h-[500vh] w-full bg-black">
      
      {!imagesLoaded && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse text-white">
            Sincronizando
          </p>
        </div>
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-12 md:px-24 pb-24">
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
              <p className="text-base text-white/80 max-w-sm leading-relaxed font-medium">{currentPhase.description}</p>
              
              <div className="pt-6 flex gap-4">
                <Button asChild size="lg" className="bg-white text-black rounded-none px-12 h-12 font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform hover:bg-gray-200">
                  <a href={DASHBOARD_URL} target="_blank">Aceder</a>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white bg-transparent rounded-none px-12 h-12 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
                  Programa
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <Button onClick={handlePrevPhase} variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full">
              <ChevronLeft size={20}/>
            </Button>
            <div className="flex items-baseline gap-1 text-center w-12 justify-center">
              <span className="text-4xl font-black tracking-tighter text-white/80 italic">{currentPhase.index}</span>
              <span className="text-[10px] font-bold text-white/50">/ 03</span>
            </div>
            <Button onClick={handleNextPhase} variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full">
              <ChevronRight size={20}/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
