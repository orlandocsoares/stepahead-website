'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // 1. Carregamento da animação do Supabase
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 0; i < 100; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(2, '0');
      img.src = `https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Video%20Intro%20MP4/frame_${frameNum}_delay-0.042s.webp`;
      img.onload = () => {
        loadedImages[i] = img;
        if (i === 0) render(img); 
      };
    }
    setImages(loadedImages);
  }, []);

  const render = (imgFrame: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgFrame) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const imgRatio = imgFrame.width / imgFrame.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.width / imgRatio;

    if (drawHeight < canvas.height) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * imgRatio;
    }

    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(imgFrame, offsetX, offsetY, drawWidth, drawHeight);
  };

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const frameIndex = Math.floor(v * (images.length - 1));
      if (images[frameIndex]) render(images[frameIndex]);
    });
    return () => unsubscribe();
  }, [images, scrollYProgress]);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Animação de Fundo (Canvas) */}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-90"
        />

        {/* Camada de UI: Alinhamento consistente com o projeto */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center px-12 md:px-24">
          
          {/* Lado Esquerdo: Conteúdo Principal (Afastado do centro da imagem) */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-start"
            >
              <span className="text-black/40 text-[10px] md:text-xs uppercase tracking-[0.5em] font-bold mb-2">
                O Início
              </span>
              <h1 className="text-black text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
                INTRODUÇÃO
              </h1>
              <p className="text-black/60 text-sm md:text-base max-w-sm leading-relaxed mb-10">
                Explora os conceitos fundamentais e a visão do portal para o ensino secundário em Angola.
              </p>

              {/* Botões Alinhados */}
              <div className="flex gap-4">
                <button className="bg-black text-white px-8 py-3 font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                  ACEDER
                </button>
                <button className="border border-black text-black px-8 py-3 font-bold text-[10px] uppercase tracking-widest hover:bg-black/5 transition-colors">
                  PROGRAMA
                </button>
              </div>
            </motion.div>
          </div>

          {/* Canto Inferior Direito: Navegador de Fases Elegante */}
          <div className="absolute bottom-12 right-12 md:bottom-20 md:right-24">
            <div className="flex items-end gap-3 group cursor-pointer">
              <div className="flex flex-col items-end mb-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/30">Fase</span>
                <div className="h-[1px] w-8 bg-black/20 my-1" />
              </div>
              <div className="flex items-baseline">
                <span className="text-6xl md:text-8xl font-black italic text-black leading-none">01</span>
                <span className="text-black/30 font-bold text-sm ml-2 tracking-tighter">/ 03</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}