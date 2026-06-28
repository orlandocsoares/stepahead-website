"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Hourglass, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
export default function WelcomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(({ profile }) => setProfile(profile ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
      
      <div className="max-w-xl w-full text-center space-y-10 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)]"
        >
          <ShieldCheck size={44} className="text-blue-400" />
        </motion.div>

        <div className="space-y-3">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[9px] tracking-[0.8em] text-blue-400 uppercase font-black italic">
            Endereço Electrónico Confirmado
          </motion.p>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-5xl sm:text-6xl font-extralight uppercase tracking-tighter leading-none">
            Conta <span className="font-bold italic text-white">Verificada</span>
          </motion.h1>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white/50 text-[11px] leading-relaxed tracking-widest uppercase max-w-sm mx-auto">
          {profile?.first_name ? `Saudações, ${profile.first_name}. ` : ""}A autenticidade dos seus dados foi assegurada. O processo encontra-se na fase final de homologação técnica.
        </motion.p>

        {/* Quadro Informativo Anti-Ansiedade */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl text-left space-y-5 max-w-md mx-auto"
        >
          <h3 className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
            <Hourglass size={12} className="animate-spin text-blue-400" style={{ animationDuration: '4s' }} /> Próximas Acções de Controlo:
          </h3>
          <ul className="space-y-4 text-[10px] text-white/50 tracking-wider uppercase leading-relaxed font-medium">
            <li className="flex gap-3 items-start"><CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" /> <span>1. Auditoria e triagem de perfil pelo Inspector de Conteúdos.</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" /> <span>2. Activação imediata das credenciais de acesso ao Terminal.</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" /> <span>3. Recepção de aviso de abertura da plataforma no seu e-mail.</span></li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="pt-2">
          <button onClick={() => router.push('/')} className="px-6 md:px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-blue-600 hover:text-white transition-all">
            Voltar ao Menu Principal
          </button>
        </motion.div>
      </div>

      <footer className="absolute bottom-8 text-center w-full">
         <p className="text-[7px] uppercase tracking-[1em] text-white/10 font-black">Projecto Saber Mais Angola // Governação & Educação</p>
      </footer>
    </main>
  );
}