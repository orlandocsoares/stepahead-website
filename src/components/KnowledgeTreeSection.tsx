'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export function KnowledgeTreeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  // Física suave para o scroll (evita que o vídeo trema)
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 70 });

  // 1. O vídeo começa invisível e ganha opacidade gradualmente
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  
  // 2. Parallax: O vídeo move-se ligeiramente para dar sensação de profundidade
  const y = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  // Carregar duração do vídeo para o efeito de "construção"
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      video.onloadedmetadata = () => setDuration(video.duration);
    }
  }, []);

  // Sincronizar vídeo com o scroll
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (videoRef.current && duration) {
        const time = latest * duration;
        if (isFinite(time)) videoRef.current.currentTime = time;
      }
    });
    return () => unsubscribe();
  }, [duration, smoothProgress]);

  return (
    <section 
      ref={containerRef} 
      id="programa" 
      // Começa muito antes (-mt-[100vh]) para permitir a fusão suave
      className="relative h-[400vh] -mt-[100vh] z-10" 
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* CONTAINER DO VÍDEO COM MÁSCARA */}
        <motion.div 
          style={{ opacity }}
          className="relative w-full h-full flex items-center justify-center"
        >
           {/* Fundo Gradual: Transita do transparente para o Slate Escuro */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950 z-0" />

           {/* Camada do Vídeo */}
           <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
              {/* Máscara CSS: Torna o topo transparente para fundir com a secção anterior */}
              <div className="w-full h-full [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,black_100%)]">
                <video 
                  ref={videoRef}
                  muted 
                  playsInline 
                  className="w-full h-full object-cover opacity-90 mix-blend-normal" 
                  preload="auto"
                >
                  <source 
                    src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" 
                    type="video/mp4" 
                  />
                </video>
              </div>
           </motion.div>
        </motion.div>

        {/* Sem textos, apenas o vídeo centralizado */}
      </div>
    </section>
  );
}