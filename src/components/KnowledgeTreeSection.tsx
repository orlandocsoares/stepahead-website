
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
    text: "O Programa Saber Mais nasceu da necessidade de criar pontes sólidas entre o conhecimento teórico e a prática pedagógica contemporânea. Mais do que um repositório, somos uma plataforma de cooperação viva que pulsa com a energia dos nossos educadores.\n\nRegisto de actividades realizadas, relatórios de execução detalhados, evidências digitais e análise rigorosa dos resultados obtidos em cada etapa do processo pedagógico para garantir a evolução constante e a excelência educativa. Através de módulos interativos e evidências digitais, construímos um futuro onde o conhecimento é acessível, dinâmico e eterno."
  },
  {
    id: "02",
    label: "Agenda",
    title: "Planeamento\nEstratégico",
    text: "O Planeamento Estratégico é o coração da nossa organização. Através de um calendário centralizado e dinâmico, garantimos que todos os agentes estão em sintonia com os objectivos globais do programa, antecipando desafios e celebrando marcos.\n\nCalendário completo de formações, reuniões, visitas e eventos institucionais. Inclui descrição detalhada e acesso directo a todos os documentos associados para uma gestão eficiente do tempo e dos recursos pedagógicos, promovendo uma cultura de planeamento rigorosa."
  },
  {
    id: "03",
    label: "Agentes",
    title: "Agentes\nSaber Mais",
    text: "A nossa rede estende-se por diversos municípios, unindo educadores sob um propósito comum: a transformação do ensino secundário. Cada agente é uma peça fundamental neste ecossistema de partilha e inovação.\n\nDirectório completo dos agentes envolvidos: Nome, Escola e Município. Acesso a contactos institucionais e histórico detalhado de todas as actividades realizadas, promovendo a transparência, o reconhecimento e a colaboração mútua entre pares de diferentes regiões."
  },
  {
    id: "04",
    label: "Equipa",
    title: "Equipa de\nCoordenação",
    text: "A coordenação do Programa Saber Mais é composta por especialistas dedicados a remover barreiras e potenciar o talento docente. O nosso suporte é técnico na execução, mas profundamente humano na intenção.\n\nEstrutura de apoio ao projecto: Coordenação estratégica, técnicos de suporte e o corpo de formadores dedicados à excelência educativa e ao acompanhamento próximo em todas as fases da implementação nas escolas, garantindo que ninguém fica para trás."
  },
  {
    id: "05",
    label: "Sobre",
    title: "Missão e\nParcerias",
    text: "A nossa missão é clara: capacitar hoje para os desafios de amanhã. Através de parcerias estratégicas de alto nível, elevamos os padrões da educação pública, criando um legado de conhecimento eterno e acessível.\n\nMissão do projecto e enquadramento institucional. Conheça os nossos parceiros estratégicos, o enquadramento legal e os canais oficiais de contacto para suporte especializado e esclarecimento de dúvidas estruturais sobre a visão a longo prazo do programa."
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
    <section ref={containerRef} className="relative h-[800vh] -mt-[100vh] z-0 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto">
        <motion.div style={{ opacity, filter }} className="relative w-full h-full bg-black">
           <video ref={videoRef} muted playsInline className="w-full h-full object-cover opacity-60" preload="auto">
             <source src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" type="video/mp4" />
           </video>

           <motion.div 
             style={{ opacity: contentOpacity }}
             className="absolute inset-0 flex items-start justify-end px-16 md:px-40 pt-32 pointer-events-none"
           >
             <div className="max-w-2xl flex gap-16 pointer-events-auto">
               
               {/* Conteúdo Textual - Alinhado à Direita */}
               <div className="flex-1 space-y-12 h-full flex flex-col items-end text-right">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTextIndex}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 10 }}
                     transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                     className="space-y-8 flex-grow"
                   >
                     <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 italic">
                         Capítulo {currentItem.id} — {currentItem.label}
                       </p>
                       <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-[1] text-white whitespace-pre-line">
                         {currentItem.title}
                       </h2>
                     </div>

                     <div className="space-y-6 max-w-md ml-auto">
                        <p className="text-[13px] md:text-sm font-medium italic text-white/60 leading-relaxed text-justify whitespace-pre-line">
                          {currentItem.text}
                        </p>
                     </div>
                   </motion.div>
                 </AnimatePresence>

                 {/* Controlos Inferiores - Alinhados à direita */}
                 <div className="flex items-center gap-8 pt-12 pb-20 justify-end">
                   <button onClick={() => window.open(DASHBOARD_URL, "_blank")} className="group flex items-center gap-6">
                     <div className="h-[1px] w-6 bg-white/20 group-hover:w-12 group-hover:bg-white transition-all duration-700" />
                     <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/80 group-hover:text-white transition-all">sabermais</span>
                   </button>
                   
                   <div className="h-[1px] w-16 bg-white/10" />

                   <div className="flex gap-4">
                     <button 
                       onClick={prevChapter}
                       className="p-3 border border-white/5 hover:border-white/20 text-white/20 hover:text-white transition-all rounded-full group bg-white/[0.02] shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                     >
                       <ChevronUp size={14} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform" />
                     </button>
                     <button 
                       onClick={nextChapter}
                       className="p-3 border border-white/5 hover:border-white/20 text-white/20 hover:text-white transition-all rounded-full group bg-white/[0.02] shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                     >
                       <ChevronDown size={14} strokeWidth={1.5} className="group-hover:translate-y-0.5 transition-transform" />
                     </button>
                   </div>
                 </div>
               </div>

               {/* Navegação Lateral - Elevada com Profundidade (Glassmorphism e Sombras) */}
               <div className="relative flex flex-col items-center gap-4 pt-8 pb-8 px-2 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-700">
                 <button 
                   onClick={prevChapter}
                   className="text-white/20 hover:text-white transition-all duration-500 hover:scale-110 mb-2"
                 >
                   <ChevronUp size={16} strokeWidth={1} />
                 </button>

                 <div className="flex flex-col items-center gap-8">
                  {TREE_CONTENT.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTextIndex(idx)}
                      className="group relative flex flex-col items-center gap-4"
                    >
                      {/* Efeito de brilho de fundo para o item activo */}
                      <AnimatePresence>
                        {activeTextIndex === idx && (
                          <motion.div
                            layoutId="nav-active-bg"
                            className="absolute -inset-2 bg-white/[0.05] blur-xl rounded-full z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </AnimatePresence>

                      <span className={`relative z-10 text-[10px] font-black tabular-nums transition-all duration-1000 ${activeTextIndex === idx ? 'text-white scale-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-white/20 group-hover:text-white/40'}`}>
                        {item.id}
                      </span>
                      
                      <div className={`relative z-10 w-[1.5px] transition-all duration-1000 ${activeTextIndex === idx ? 'h-12 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'h-4 bg-white/10 group-hover:bg-white/30'}`} />
                    </button>
                  ))}
                 </div>

                 <button 
                   onClick={nextChapter}
                   className="text-white/20 hover:text-white transition-all duration-500 hover:scale-110 mt-2"
                 >
                   <ChevronDown size={16} strokeWidth={1} />
                 </button>
               </div>

             </div>
           </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
