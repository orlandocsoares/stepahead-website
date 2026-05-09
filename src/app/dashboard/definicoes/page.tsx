"use client";

import { useProfile } from "@/hooks/useProfile";
import { motion } from "framer-motion";
import { User, Mail, MapPin, BookOpen, Award, Settings, Save, ShieldCheck } from "lucide-react";
import { MagneticButton } from "@/components/MagneticButton";

export default function PerfilPage() {
  const { profile, loading } = useProfile();

  // Áreas oficiais do programa extraídas da documentação 
  const areasIntervencao = [
    "Língua Portuguesa", "Matemática", "Pré-Escolar", 
    "Educação Inclusiva", "Expressão Plástica", "Expressão Físico-Motora"
  ];

  if (loading) return <div className="p-10 text-white/20 uppercase tracking-[0.3em] text-[10px] animate-pulse font-sans">Sincronizando Perfil de Elite...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans pointer-events-auto relative z-50">
      
      {/* HEADER PREMIUM COM IDENTIDADE VISUAL */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="w-40 h-40 rounded-full border-2 border-white/10 bg-white/[0.02] backdrop-blur-3xl flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
            <User size={80} strokeWidth={0.5} className="text-white/20 group-hover:text-blue-400/50 transition-colors duration-700" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 cursor-none">
              <Settings size={24} className="text-white animate-spin-slow" />
            </div>
          </div>
        </div>

        <div className="text-center md:text-left space-y-3">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              Agente Educativo Autorizado
            </div>
          </div>
          <h1 className="text-5xl font-light text-white uppercase tracking-tighter">
            {profile?.first_name || 'Utilizador'} <span className="font-bold">{profile?.last_name || ''}</span>
          </h1>
          <p className="text-white/30 text-[11px] uppercase tracking-[0.5em]">Programa Saber Mais Angola • III Ciclo [cite: 3]</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA: DADOS E ESPECIALIZAÇÃO */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-8">
          <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-50" />
            
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-white/40 flex items-center gap-3">
               <ShieldCheck size={16} className="text-blue-500" /> Configurações de Identidade
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] uppercase text-white/20 tracking-widest flex items-center gap-2"><Mail size={14} className="text-blue-400/50"/> Email de Acesso</label>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white/70 font-light italic">
                  {profile?.email || 'aguardando_sincronizacao@sabermals.ao'}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase text-white/20 tracking-widest flex items-center gap-2"><MapPin size={14} className="text-blue-400/50"/> Província de Atuação [cite: 31]</label>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white/70 font-light">
                  {profile?.province || 'Luanda / Bié'} [cite: 32]
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <label className="text-[10px] uppercase text-white/20 tracking-widest flex items-center gap-2"><BookOpen size={14} className="text-blue-400/50"/> Áreas de Intervenção Pedagógica [cite: 33]</label>
              <div className="flex flex-wrap gap-3">
                {areasIntervencao.map((area, i) => (
                  <motion.span 
                    key={i} 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                    className="px-5 py-3 rounded-2xl text-[10px] uppercase tracking-widest border border-white/10 bg-white/[0.01] text-white/40 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-500 cursor-none"
                  >
                    {area}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-6">
             <p className="text-[10px] text-white/20 uppercase tracking-widest italic">As alterações serão validadas pela coordenação</p>
             <MagneticButton strength={0.2}>
                <button className="px-10 py-5 rounded-[1.5rem] bg-white text-black text-[11px] uppercase font-black tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all duration-700 flex items-center gap-4 group shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <Save size={18} className="group-hover:scale-125 transition-transform duration-500" /> Gravar Definições
                </button>
             </MagneticButton>
          </div>
        </motion.div>

        {/* COLUNA: IMPACTO E STATS */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-8">
          <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
              <Award size={200} />
            </div>
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-white/40 mb-10">Estado da Capacitação</h3>
            
            <div className="space-y-8 relative z-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Progresso Global</span>
                  <span className="text-3xl font-light text-blue-400 tracking-tighter">75%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: "75%" }} 
                    transition={{ duration: 2, ease: "circOut" }} 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                  />
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/5">
                <p className="text-[11px] text-white/40 leading-relaxed uppercase tracking-wider font-light">
                  "Capacitar e valorizar os recursos humanos do sistema educativo angolano." [cite: 11]
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20 backdrop-blur-3xl group">
            <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 font-black mb-4">Canal de Apoio</p>
            <p className="text-[11px] text-white/50 mb-8 leading-relaxed uppercase tracking-widest font-light">Necessita de assistência técnica ou pedagógica?</p>
            <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] uppercase tracking-[0.3em] text-white/80 hover:bg-white hover:text-black transition-all duration-700">
              Contactar Suporte
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}