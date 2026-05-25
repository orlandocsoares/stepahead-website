"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INSTITUTIONAL_PARTNERS = [
  {
    name: "Governo de Angola",
    subtitle: "Ministério da Educação",
    summary: "Tutela governamental responsável pela definição, condução e execução da política nacional do systema educativo.",
    src: "/storage/v1/object/public/Logo%20Institutos/med.png"
  },
  {
    name: "República de Angola",
    subtitle: "Insígnia Oficial",
    summary: "Símbolo máximo de soberania nacional, reflectindo a história, a identidade e os valores do Estado Angolano.",
    src: "/storage/v1/object/public/Logo%20Institutos/insignia.png"
  },
  {
    name: "INFQE",
    subtitle: "Instituto de Formação",
    summary: "Instituto Nacional de Formação de Quadros da Educação, pivot na valorização dos agentes del ensino.",
    src: "/storage/v1/object/public/Logo%20Institutos/infqe.png"
  },
  {
    name: "Camões, I.P.",
    subtitle: "Cooperação Portuguesa",
    summary: "Instituto da Cooperação e da Língua, organismo supervisor da parceria bilateral e do apoio ao reforço pedagógico.",
    src: "/storage/v1/object/public/Logo%20Institutos/icamoes.png"
  }
];

export function InstitutionalBranding() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % INSTITUTIONAL_PARTNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const activePartner = INSTITUTIONAL_PARTNERS[currentIdx];

  return (
    <div className="fixed right-0 top-0 h-screen z-[90] flex items-center pointer-events-none hidden xl:flex">
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="mr-6 pointer-events-auto flex flex-col items-center justify-between p-6 bg-white/[0.002] backdrop-blur-md border border-white/5 rounded-[3rem] shadow-none w-64 h-[718px]"
      >
        <div className="text-center pb-4 border-b border-white/[0.03] w-full">
          <p className="text-[7px] tracking-[0.25em] text-white/20 uppercase font-black font-sans">Tutoria Governamental</p>
          <p className="text-[8px] tracking-widest text-blue-500/50 uppercase font-bold italic font-sans mt-[1px]">Bilateral Network</p>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="w-full flex flex-col items-center text-center space-y-6"
            >
              <div className="w-full h-36 bg-white p-1 overflow-hidden rounded-2xl flex items-center justify-center shadow-lg">
                <img
                  src={activePartner.src}
                  alt={activePartner.name}
                  className="w-full h-full object-contain select-none scale-[1.3]"
                />
              </div>

              <div className="space-y-1 px-2 text-center">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-white font-sans leading-tight">
                  {activePartner.name}
                </h4>
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 italic leading-none mt-1">
                  {activePartner.subtitle}
                </p>
              </div>

              <p className="text-[10.5px] text-white/50 font-light leading-relaxed px-2 text-center h-20 overflow-hidden">
                {activePartner.summary}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2 justify-center pb-4">
          {INSTITUTIONAL_PARTNERS.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 rounded-full transition-all duration-500 ${idx === currentIdx ? "w-4 bg-blue-500" : "w-1 bg-white/10"}`}
            />
          ))}
        </div>

        <div className="text-center pt-3 border-t border-white/[0.03] w-full">
          <p className="text-[6px] tracking-[0.3em] text-white/10 font-mono uppercase">Projecto PSM // 2026</p>
        </div>
      </motion.div>
    </div>
  );
}