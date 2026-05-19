"use client";

import { CommandCenter } from "@/components/CommandCenter";
import { InstitutionalBranding } from "@/components/InstitutionalBranding";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden">
      
      {/* WRAPPER DE TRANSIÇÃO - CANALIZA A VIA DE CIRCULAÇÃO À DIREITA (SUGESTÃO 2) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          /* REFINAMENTO GEOMÉTRICO: xl:pr-[320px] abre o espaço exacto para a barra institucional.
             O conteúdo central e a navegação superior recuam e respiram organicamente, sem sobreposições. */
          className="relative z-10 w-full min-h-screen bg-transparent xl:pr-[320px] transition-all duration-500"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* TERMINAL DE NAVEGAÇÃO LATERAL EM LEQUE (ESQUERDA) */}
      <CommandCenter />

      {/* PAINEL DE BRANDING INSTITUCIONAL DINÂMICO (DIREITA) */}
      <InstitutionalBranding />

      {/* MARCA DE ÁGUA TÉCNICA (RODAPÉ DISCRETO) */}
      <div className="fixed bottom-6 right-10 z-50 pointer-events-none opacity-20 flex flex-col items-end">
        <p className="text-[7px] uppercase tracking-[0.8em] font-black text-blue-500 italic">
          PSM_System_Active
        </p>
        <p className="text-[5px] uppercase tracking-[0.4em] text-white/40 mt-1">
          Build_ID: 2026.1_PRO_GLASS
        </p>
      </div>

    </div>
  );
}