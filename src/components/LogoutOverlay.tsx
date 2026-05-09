"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export function LogoutOverlay() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-[100px] flex flex-col items-center justify-center text-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "circOut" }}
        className="space-y-6"
      >
        <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <ShieldAlert size={32} className="text-white/40 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-white uppercase tracking-[0.4em]">Sessão Terminada</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.5em]">A encerrar portal Saber Mais Angola...</p>
        </div>

        {/* Linha de progresso de fecho */}
        <div className="w-48 h-[1px] bg-white/5 mx-auto relative overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}