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
    text: "Registo de actividades realizadas, relatórios de execução detalhados, evidências digitais e análise rigorosa dos resultados obtidos em cada etapa do processo pedagógico."
  },
  {
    id: "02",
    label: "Agenda",
    title: "Planeamento\nEstratégico",
    text: "Calendário completo de formações, reuniões, visitas e eventos institucionais. Inclui descrição detalhada e acesso directo a todos os documentos associados."
  },
  {
    id: "03",
    label: "Agentes",
    title: "Agentes\nSaber Mais",
    text: "Directório completo dos agentes envolvidos: Nome, Escola e Município. Acesso a contactos institucionais e histórico detalhado de todas as actividades realizadas."
  },
  {
    id: "04",
    label: "Equipa",
    title: "Equipa de\nCoordenação",
    text: "Estrutura de apoio ao projecto: Coordenação estratégica, técnicos de suporte e o corpo de formadores dedicados à excelência educativa e acompanhamento próximo."
  },
  {
    id: "05",
    label: "Sobre",
    title: "Missão e\nParcerias",
    text: "Missão do projecto e enquadramento institucional. Conheça os nossos parceiros estratégicos, o enquadramento legal e os canais oficiais de contacto para suporte."
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
  const opacity = useTransform(smoothProgress, [0, 0.15], [0, 1]);
  const filter = useTransform(smoothProgress, [0, 0.2], ["blur(32px)", "blur(0px)"]);

  const contentOpacity = useTransform(smoothProgress, [0.25, 0.35, 0.9, 1], [0, 1, 1, 0]);
  const contentY = useTransform(smoothProgress, [0.25, 0.35], [30, 0]);

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
      if (v > 0.3 && v < 0.9) {
        const sectionProgress = (v - 0.3) / 0.6;
        const newIndex = Math.min(Math.floor(sectionProgress * TREE_CONTENT.length), TREE_CONTENT.length - 1);
        setActiveTextIndex(newIndex);
      }
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  const currentItem = TREE_CONTENT[activeTextIndex];

  return (
    <section ref={containerRef} className="relative h-[800vh] -mt-[100vh] z-0 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto">
        <motion.div style={{ opacity, filter }} className="relative w-full h-full bg-black">
           <video ref={videoRef} muted playsInline className="w-full h-full object-cover opacity-60" preload="auto">
             <source src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" type="video/mp4" />
           </video>

           <motion.div 
             style={{ opacity: contentOpacity, y: contentY }}
             className="absolute inset-0 flex items-center justify-end px-16 md:px-40 pointer-events-none"
           >
             <div className="max-w-2xl flex gap-12 pointer-events-auto">
               
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

               <div className="flex-1 space-y-10 min-h-[400px] flex flex-col justify-center">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTextIndex}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="space-y-8"
                   >
                     <div className="space-y-3">
                       <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30 italic">
                         Capítulo {currentItem.id} — {currentItem.label}
                       </p>
                       <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter italic leading-none text-white/90 whitespace-pre-line">
                         {currentItem.title}
                       </h2>
                     </div>

                     <p className="text-sm md:text-base font-medium italic text-white/50 leading-relaxed text-justify max-w-md">
                       {currentItem.text}
                     </p>

                     <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-4 pt-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 group-hover:text-white transition-all">sabermais</span>
                       <div className="h-[1px] w-6 bg-white/20 group-hover:w-10 group-hover:bg-white transition-all duration-500" />
                     </button>
                   </motion.div>
                 </AnimatePresence>

                 <div className="flex items-center gap-8 pt-10">
                   <div className="flex gap-3">
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
                     Modo de Leitura Activo
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