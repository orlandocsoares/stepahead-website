'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, easeInOut, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DASHBOARD_URL } from "@/lib/program-config";

const TREE_CONTENT = [
  {
    id: "01",
    label: "QUEM SOMOS",
    title: "Projectos e\nActividades",
    text: "O Programa Saber Mais nasceu da necessidade de criar pontes sólidas entre o conhecimento teórico e a prática pedagógica contemporânea.\n\nMais do que um simples repositório, somos uma plataforma de cooperação viva que pulsa com a energia e dedicação dos nossos educadores em todo o território nacional."
  },
  {
    id: "02",
    label: "Agenda",
    title: "Planeamento\nEstratégico",
    text: "O Planeamento Estratégico é o coração operacional da nossa organização. Através de um calendário centralizado e dinâmico, garantimos que todos os agentes estão em total sintonia com os objectivos globais do programa."
  },
  {
    id: "03",
    label: "Agentes",
    title: "Agentes\nSaber Mais",
    text: "A nossa rede estende-se por diversos municípios, unindo educadores sob um propósito comum e inabalável: a transformação profunda do ensino secundário em Portugal."
  },
  {
    id: "04",
    label: "Equipa",
    title: "Equipa de\nCoordenação",
    text: "A coordenação do Programa Saber Mais é composta por um corpo de especialistas dedicados a remover barreiras burocráticas e potenciar o talento docente em todas as suas vertentes."
  },
  {
    id: "05",
    label: "Sobre",
    title: "Missão e\nParcerias",
    text: "A nossa missão é clara e ambiciosa: capacitar os educadores de hoje para os desafios imprevisíveis de amanhã.\n\nAtravés de parcerias estratégicas de alto nível, elevamos os padrões da educação pública."
  }
];

export function KnowledgeTreeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 120, damping: 20 });
  
  const easedProgress = useTransform(smoothProgress, [0, 1], [0, 1], { ease: easeInOut });
  const opacity = useTransform(smoothProgress, [0, 0.15], [0, 1]);
  const filter = useTransform(smoothProgress, [0, 0.2], ["blur(32px)", "blur(0px)"]);

  const contentOpacity = useTransform(smoothProgress, [0.75, 0.85, 0.98, 1], [0, 1, 1, 0]);

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

  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (v) => {
      if (v > 0.8 && v < 0.98) {
        const sectionProgress = (v - 0.8) / 0.18;
        const newIndex = Math.min(Math.floor(sectionProgress * TREE_CONTENT.length), TREE_CONTENT.length - 1);
        setActiveTextIndex(newIndex);
      }
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  const currentItem = TREE_CONTENT[activeTextIndex];

  const nextChapter = () => setActiveTextIndex((p) => (p + 1) % TREE_CONTENT.length);
  const prevChapter = () => setActiveTextIndex((p) => (p - 1 + TREE_CONTENT.length) % TREE_CONTENT.length);

  return (
    <section ref={containerRef} className="relative h-[450vh] -mt-[100vh] z-0 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto">
        <motion.div style={{ opacity, filter }} className="relative w-full h-full bg-[#00040a]">
           <video ref={videoRef} muted playsInline className="w-full h-full object-cover opacity-25" preload="auto">
             <source src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" type="video/mp4" />
           </video>

           <motion.div 
             style={{ opacity: contentOpacity }}
             className="absolute inset-0 flex items-stretch justify-end px-16 md:px-40 pt-32 pb-24 pointer-events-none"
           >
             <div className="max-w-2xl flex items-end gap-16 pointer-events-auto h-full">
               
               {/* Coluna de Texto - Alinhamento à Esquerda */}
               <div className="flex-1 flex flex-col items-start text-left h-full justify-center">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTextIndex}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -5 }}
                     transition={{ duration: 0.6 }}
                     className="space-y-10"
                   >
                     <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">
                         Capítulo {currentItem.id} — {currentItem.label}
                       </p>
                       <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-[1] text-white whitespace-pre-line">
                         {currentItem.title}
                       </h2>
                     </div>

                     <div className="max-w-md">
                        <p className="text-[13px] md:text-sm font-medium italic text-white/50 leading-relaxed text-justify whitespace-pre-line">
                          {currentItem.text}
                        </p>
                     </div>
                   </motion.div>
                 </AnimatePresence>

                 {/* Botão alinhado à esquerda da caixa de texto */}
                 <div className="mt-12">
                   <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-6">
                     <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/80 group-hover:text-white transition-all">sabermais</span>
                     <div className="h-[1px] w-6 bg-white/20 group-hover:w-12 group-hover:bg-white transition-all duration-700" />
                   </button>
                 </div>
               </div>

               {/* Navegação Lateral - Estilo Numerador do Hero */}
               <div className="flex flex-col items-center gap-6 mb-2">
                 <div className="flex flex-col items-center gap-1">
                   <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 italic">Cap</span>
                   <span className="text-sm font-bold text-white/60 tabular-nums">{currentItem?.id}</span>
                 </div>
                 
                 <div className="relative h-28 w-[1px] bg-white/10 overflow-hidden">
                   <motion.div 
                     animate={{ height: `${((activeTextIndex + 1) / TREE_CONTENT.length) * 100}%` }} 
                     className="absolute top-0 w-full bg-white/60 transition-all duration-1000" 
                   />
                 </div>
                 
                 <div className="flex flex-col items-center gap-1">
                   <span className="text-sm font-bold text-white/20 tabular-nums">0{TREE_CONTENT.length}</span>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-white/10 italic">Total</span>
                 </div>
                 
                 <div className="mt-4 flex flex-col gap-1">
                   <button onClick={prevChapter} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronUp size={16} /></button>
                   <button onClick={nextChapter} className="p-2 text-white/20 hover:text-white transition-colors"><ChevronDown size={16} /></button>
                 </div>
               </div>

             </div>
           </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
