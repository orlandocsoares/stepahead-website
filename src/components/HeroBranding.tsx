"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HERO_PARTNERS = [
  {
    name: "Ministério da Educação",
    subtitle: "Governo de Angola",
    summary: "Tutela governamental responsável pela definição, condução e execução da política nacional do systema educativo.",
    src: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Institutos/med.png"
  },
  {
    name: "República de Angola",
    subtitle: "Insígnia Oficial",
    summary: "Símbolo máximo de soberania nacional, reflectindo a história, a identidade e os valores do Estado Angolano.",
    src: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Institutos/insignia.png"
  },
  {
    name: "INFQE",
    subtitle: "Instituto de Formação",
    summary: "Instituto Nacional de Formação de Quadros da Educação, pivot na valorização dos agentes do ensino.",
    src: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Institutos/infqe.png"
  },
  {
    name: "Camões, I.P.",
    subtitle: "Cooperação Portuguesa",
    summary: "Instituto da Cooperação e da Língua, organismo supervisor da parceria bilateral e do apoio ao reforço pedagógico.",
    src: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Institutos/icamoes.png"
  }
];

export function HeroBranding() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_PARTNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activePartner = HERO_PARTNERS[index];

  return (
    /* ALINHAMENTO: right-6 sm:right-16 (Igual ao Relógio) | bottom-6 md:bottom-10 (Mancha Amarela) */
    <div className="fixed right-6 sm:right-16 bottom-6 md:bottom-10 z-40 flex items-end pointer-events-none hidden xl:flex select-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        /* OPACIDADE DINÂMICA: 40% de base, 100% no hover. Transição suave de 700ms */
        className="pointer-events-auto flex flex-col items-center justify-end w-44 md:w-64 bg-transparent opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default"
      >
        {/* CAIXA DE ALTURA FIXA AUMENTADA (200px): Acomoda o texto completo sem causar saltos visuais na página */ }
        <div className="relative w-full h-[200px]">
          {/* SEM mode="wait" para um crossfade cinematográfico perfeito */}
          <AnimatePresence>
            <motion.div
              key={index}
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full flex flex-col items-center text-center space-y-3"
            >
              {/* CÁPSULA DO LOGÓTIPO BRANCA (Shrink-0 para manter a altura exacta) */}
              <div className="w-full h-20 bg-white p-0 overflow-hidden rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.4)] border border-white/10 shrink-0">
                <img
                  src={activePartner.src}
                  alt={activePartner.name}
                  className="w-full h-full object-contain select-none scale-[1.3]"
                />
              </div>

              {/* BLOCO TEXTUAL REINTRODUZIDO */}
              <div className="flex flex-col items-center space-y-1">
                <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-white/90 font-sans leading-tight drop-shadow-md">
                  {activePartner.name}
                </h4>
                <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-blue-400 italic leading-none drop-shadow-sm">
                  {activePartner.subtitle}
                </p>
                <p className="text-[8.5px] md:text-[9px] text-white/50 font-light leading-relaxed pt-1.5 px-1 h-[60px] overflow-hidden">
                  {activePartner.summary}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}