
'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, easeInOut, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

const TREE_CONTENT = [
  {
    id: "01",
    label: "Raízes",
    title: "A Árvore do\nConhecimento",
    text: "O programa foca-se na consolidação estrutural. Tal como uma árvore, a aprendizagem ramifica-se em múltiplas disciplinas, mantendo-se fiel às raízes da nossa cultura educativa."
  },
  {
    id: "02",
    label: "Estrutura",
    title: "Consolidação\nDigital",
    text: "Através de módulos interativos e evidências digitais, construímos um futuro onde o conhecimento é acessível, dinâmico e eterno. A estrutura digital garante a perenidade do saber."
  },
  {
    id: "03",
    label: "Expansão",
    title: "Ecossistema\nde Inovação",
    text: "A expansão do saber não conhece limites. Cada novo módulo é uma folha que capta a luz da inovação, nutrindo todo o ecossistema educativo com novas perspetivas."
  }
];

export function KnowledgeTreeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });
  
  const easedProgress = useTransform(smoothProgress, [0, 1], [0, 1], { ease: easeInOut });
  const opacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);
  const filter = useTransform(smoothProgress, [0, 0.25], ["blur(32px)", "blur(0px)"]);

  // Animações para o conteúdo flutuante
  const contentOpacity = useTransform(smoothProgress, [0.3, 0.4, 0.9, 1], [0, 1, 1, 0]);
  const contentY = useTransform(smoothProgress, [0.3, 0.4], [30, 0]);

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

  const currentItem = TREE_CONTENT[activeTextIndex];

  return (
    <section ref={containerRef} className="relative h-[400vh] -mt-[100vh] z-0 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto">
        <motion.div style={{ opacity, filter }} className="relative w-full h-full bg-black">
           <video ref={videoRef} muted playsInline className="w-full h-full object-cover opacity-60" preload="auto">
             <source src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" type="video/mp4" />
           </video>

           {/* Layout Elegante sem fundo - Alinhado à Direita */}
           <motion.div 
             style={{ opacity: contentOpacity, y: contentY }}
             className="absolute inset-0 flex items-center justify-end px-16 md:px-40 pointer-events-none"
           >
             <div className="max-w-xl flex gap-12 pointer-events-auto">
               
               {/* Numerador Elegante (Vertical) */}
               <div className="flex flex-col items-center gap-6 pt-2">
                 {TREE_CONTENT.map((item, idx) => (
                   <button
                     key={item.id}
                     onClick={() => setActiveTextIndex(idx)}
                     className="group flex flex-col items-center gap-2"
                   >
                     <span className={`text-[10px] font-bold tabular-nums transition-colors duration-500 ${activeTextIndex === idx ? 'text-white' : 'text-white/20'}`}>
                       {item.id}
                     </span>
                     <div className={`w-[1px] transition-all duration-700 ${activeTextIndex === idx ? 'h-8 bg-white' : 'h-4 bg-white/10 group-hover:bg-white/30'}`} />
                   </button>
                 ))}
               </div>

               {/* Conteúdo de Texto */}
               <div className="flex-1 space-y-10">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTextIndex}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="space-y-6"
                   >
                     <div className="space-y-2">
                       <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30 italic">
                         Capítulo {currentItem.id} — {currentItem.label}
                       </p>
                       <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none text-white/90 whitespace-pre-line">
                         {currentItem.title}
                       </h2>
                     </div>

                     <p className="text-sm font-medium italic text-white/50 leading-relaxed text-justify max-w-sm">
                       {currentItem.text}
                     </p>
                   </motion.div>
                 </AnimatePresence>

                 {/* Controles de Navegação Compactos */}
                 <div className="flex items-center gap-8 pt-6">
                   <div className="flex gap-2">
                     <button 
                       onClick={() => setActiveTextIndex((p) => (p - 1 + TREE_CONTENT.length) % TREE_CONTENT.length)}
                       className="p-3 border border-white/10 hover:border-white/40 text-white/30 hover:text-white transition-all rounded-full"
                     >
                       <ChevronUp size={16} />
                     </button>
                     <button 
                       onClick={() => setActiveTextIndex((p) => (p + 1) % TREE_CONTENT.length)}
                       className="p-3 border border-white/10 hover:border-white/40 text-white/30 hover:text-white transition-all rounded-full"
                     >
                       <ChevronDown size={16} />
                     </button>
                   </div>
                   <div className="h-[1px] w-24 bg-white/10" />
                   <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                     Modo de Leitura Ativo
                   </span>
                 </div>
               </div>

             </div>
           </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
