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
    text: "O Programa Saber Mais nasceu da necessidade de criar pontes sólidas entre o conhecimento teórico e a prática pedagógica contemporânea. Mais do que um repositório, somos uma plataforma de cooperação viva que pulsa com a energia dos nossos educadores.\n\nRegisto de actividades realizadas, relatórios de execução detalhados, evidências digitais e análise rigorosa dos resultados obtidos em cada etapa do processo pedagógico para garantir a evolução constante e a excelência educativa."
  },
  {
    id: "02",
    label: "Agenda",
    title: "Planeamento\nEstratégico",
    text: "O Planeamento Estratégico é o coração da nossa organização. Através de um calendário centralizado e dinâmico, garantimos que todos os agentes estão em sintonia com os objectivos globais do programa, antecipando desafios e celebrando marcos.\n\nCalendário completo de formações, reuniões, visitas e eventos institucionais. Inclui descrição detalhada e acesso directo a todos os documentos associados para uma gestão eficiente do tempo e dos recursos pedagógicos."
  },
  {
    id: "03",
    label: "Agentes",
    title: "Agentes\nSaber Mais",
    text: "A nossa rede estende-se por diversos municípios, unindo educadores sob um propósito comum: a transformação do ensino secundário. Cada agente é uma peça fundamental neste ecossistema de partilha e inovação.\n\nDirectório completo dos agentes envolvidos: Nome, Escola e Município. Acesso a contactos institucionais e histórico detalhado de todas as actividades realizadas, promovendo a transparência, o reconhecimento e a colaboração mútua entre pares."
  },
  {
    id: "04",
    label: "Equipa",
    title: "Equipa de\nCoordenação",
    text: "A coordenação do Programa Saber Mais é composta por especialistas dedicados a remover barreiras e potenciar o talento docente. O nosso suporte é técnico na execução, mas profundamente humano na intenção.\n\nEstrutura de apoio ao projecto: Coordenação estratégica, técnicos de suporte e o corpo de formadores dedicados à excelência educativa e ao acompanhamento próximo em todas as fases da implementação nas escolas."
  },
  {
    id: "05",
    label: "Sobre",
    title: "Missão e\nParcerias",
    text: "A nossa missão é clara: capacitar hoje para os desafios de amanhã. Através de parcerias estratégicas de alto nível, elevamos os padrões da educação pública, criando um legado de conhecimento eterno e acessível.\n\nMissão do projecto e enquadramento institucional. Conheça os nossos parceiros estratégicos, o enquadramento legal e os canais oficiais de contacto para suporte especializado e esclarecimento de dúvidas estruturais."
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

  // O conteúdo surge nos últimos 25% do scroll (fase final da animação)
  const contentOpacity = useTransform(smoothProgress, [0.75, 0.85, 0.98, 1], [0, 1, 1, 0]);
  const contentY = useTransform(smoothProgress, [0.75, 0.85], [40, 0]);

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
               
               <div className="flex flex-col items-center gap-6 pt-4">
                 {TREE_CONTENT.map((item, idx) => (
                   <button
                     key={item.id}
                     onClick={() => setActiveTextIndex(idx)}
                     className="group flex flex-col items-center gap-3"
                   >
                     <span className={`text-[10px] font-black tabular-nums transition-all duration-700 ${activeTextIndex === idx ? 'text-white scale-110' : 'text-white/20'}`}>
                       {item.id}
                     </span>
                     <div className={`w-[1px] transition-all duration-1000 ${activeTextIndex === idx ? 'h-10 bg-white' : 'h-4 bg-white/10 group-hover:bg-white/30'}`} />
                   </button>
                 ))}
               </div>

               <div className="flex-1 space-y-10 min-h-[500px] flex flex-col justify-center">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTextIndex}
                     initial={{ opacity: 0, x: 30 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -15 }}
                     transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                     className="space-y-8"
                   >
                     <div className="space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 italic">
                         Capítulo {currentItem.id} — {currentItem.label}
                       </p>
                       <h2 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter italic leading-[0.9] text-white whitespace-pre-line drop-shadow-2xl">
                         {currentItem.title}
                       </h2>
                     </div>

                     <div className="space-y-6 max-w-md">
                        <p className="text-sm md:text-base font-medium italic text-white/60 leading-relaxed text-justify whitespace-pre-line">
                          {currentItem.text}
                        </p>
                     </div>
                   </motion.div>
                 </AnimatePresence>

                 <div className="flex items-center gap-8 pt-12">
                   <div className="flex gap-4">
                     <button 
                       onClick={() => setActiveTextIndex((p) => (p - 1 + TREE_CONTENT.length) % TREE_CONTENT.length)}
                       className="p-4 border border-white/10 hover:border-white/40 text-white/30 hover:text-white transition-all rounded-full group bg-white/5"
                     >
                       <ChevronUp size={18} className="group-hover:-translate-y-1 transition-transform" />
                     </button>
                     <button 
                       onClick={() => setActiveTextIndex((p) => (p + 1) % TREE_CONTENT.length)}
                       className="p-4 border border-white/10 hover:border-white/40 text-white/30 hover:text-white transition-all rounded-full group bg-white/5"
                     >
                       <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                     </button>
                   </div>
                   <div className="h-[1px] w-24 bg-white/10" />
                   
                   <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-5">
                     <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white group-hover:text-white transition-all">sabermais</span>
                     <div className="h-[1px] w-8 bg-white/40 group-hover:w-14 group-hover:bg-white transition-all duration-700" />
                   </button>
                 </div>
               </div>

             </div>
           </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
