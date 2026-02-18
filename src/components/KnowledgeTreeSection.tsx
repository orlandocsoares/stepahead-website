
'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, easeInOut } from "framer-motion";

export function KnowledgeTreeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });
  
  const easedProgress = useTransform(smoothProgress, [0, 1], [0, 1], { ease: easeInOut });
  const opacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);
  const filter = useTransform(smoothProgress, [0, 0.25], ["blur(32px)", "blur(0px)"]);

  // Animações para o "Editor de Texto" flutuante
  const textOpacity = useTransform(smoothProgress, [0.35, 0.5, 0.85, 0.95], [0, 1, 1, 0]);
  const textY = useTransform(smoothProgress, [0.35, 0.5], [40, 0]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      video.onloadedmetadata = () => setDuration(video.duration);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = easedProgress.on("change", (v) => {
      if (videoRef.current && duration) {
        const time = v * duration;
        if (isFinite(time)) videoRef.current.currentTime = time;
      }
    });
    return () => unsubscribe();
  }, [duration, easedProgress]);

  return (
    <section ref={containerRef} className="relative h-[400vh] -mt-[100vh] z-0 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto">
        <motion.div style={{ opacity, filter }} className="relative w-full h-full">
           <video ref={videoRef} muted playsInline className="w-full h-full object-cover" preload="auto">
             <source src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" type="video/mp4" />
           </video>

           {/* Sobreposição Estilo "Editor de Texto" - Alinhado à Direita */}
           <motion.div 
             style={{ opacity: textOpacity, y: textY }}
             className="absolute inset-0 flex items-center justify-end px-16 md:px-40 pointer-events-none"
           >
             <div className="max-w-xl bg-black/60 backdrop-blur-3xl border border-white/10 p-10 md:p-14 text-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] pointer-events-auto">
               <div className="flex items-center gap-3 mb-10 opacity-30">
                 <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                   <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                   <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                 </div>
                 <div className="h-[1px] w-8 bg-white/10" />
                 <span className="text-[7px] font-black uppercase tracking-[0.5em] italic">Manifesto_Tree.doc</span>
               </div>

               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none mb-8">
                 A Árvore do<br />Conhecimento
               </h2>

               <div className="space-y-6">
                 <p className="text-sm font-medium italic opacity-50 leading-relaxed text-justify">
                   Nesta fase da exploração, o programa foca-se na consolidação estrutural. Tal como uma árvore, a aprendizagem ramifica-se em múltiplas disciplinas, mantendo-se fiel às raízes da nossa cultura educativa.
                 </p>
                 <p className="text-sm font-medium italic opacity-50 leading-relaxed text-justify">
                   Através de módulos interativos e evidências digitais, construímos um futuro onde o conhecimento é acessível, dinâmico e eterno.
                 </p>
               </div>

               <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                   <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">Modo de Leitura Ativo</span>
                 </div>
                 <div className="h-[1px] w-12 bg-white/10" />
               </div>
             </div>
           </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
