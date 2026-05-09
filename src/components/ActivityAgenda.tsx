"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Video, CheckCircle2, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSound } from "@/hooks/useSound";

export function ActivityAgenda() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useSound();

  useEffect(() => {
    async function fetchAgenda() {
      setLoading(true);
      const { data, error } = await supabase
        .from('agenda_atividades')
        .select('*')
        .order('data_evento', { ascending: true });

      if (!error && data) setEventos(data);
      setLoading(false);
    }
    fetchAgenda();
  }, []);

  if (loading) return (
    <div className="py-32 flex flex-col items-center gap-6">
      <Loader2 size={40} className="text-blue-500 animate-spin" />
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-sans">Sincronizando Cronograma...</p>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 relative z-40 pb-20 font-sans">
      
      {/* CABEÇALHO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] uppercase tracking-widest text-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            Planeamento Estratégico
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight uppercase">
          Agenda <span className="font-medium text-white/40">de Impacto</span>
        </h1>
      </motion.div>

      {/* LINHA DO TEMPO (TIMELINE) */}
      <div className="relative mt-20">
        {/* A LINHA VERTICAL AO CENTRO */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

        <div className="space-y-24">
          {eventos.map((ev, i) => {
            const isLeft = i % 2 === 0;
            const isCurrent = ev.status === "current";
            const isPast = ev.status === "past";

            return (
              <motion.div 
                key={ev.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`relative flex flex-col md:flex-row items-center ${isLeft ? 'md:flex-row-reverse' : ''} gap-8 md:gap-16`}
              >
                {/* O NÓ (BOLA) NA LINHA */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 z-10 flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${isCurrent ? 'bg-blue-500 border-blue-400 shadow-[0_0_15px_#3b82f6]' : 'bg-black border-white/20'}`}>
                    {isCurrent && <motion.div animate={{ scale: [1, 2.5], opacity: [0.8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-blue-500 rounded-full" />}
                  </div>
                </div>

                <div className="hidden md:block md:w-1/2" />

                {/* CARTÃO DO EVENTO EM ZIG-ZAG */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                  <motion.div 
                    onMouseEnter={() => playSound("hover")}
                    className={`p-8 rounded-[2.5rem] bg-white/[0.02] border backdrop-blur-3xl transition-all duration-500 group
                      ${isCurrent ? "border-blue-500/40 bg-blue-500/[0.04] shadow-[0_0_40px_rgba(59,130,246,0.1)]" : "border-white/5 hover:border-white/20"}
                    `}
                  >
                    <div className={`flex flex-wrap items-center gap-3 mb-6 ${isLeft ? 'md:justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon size={12} /> {new Date(ev.data_evento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }).toUpperCase()}
                      </span>
                    </div>

                    <h3 className={`text-xl font-light text-white mb-6 group-hover:text-blue-300 transition-colors ${isPast && 'opacity-40'}`}>
                      {ev.titulo}
                    </h3>

                    <div className={`flex flex-wrap items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-white/40 ${isLeft ? 'md:justify-end' : 'justify-start'}`}>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        {ev.tipo === 'online' ? <Video size={14} className="text-blue-500" /> : <MapPin size={14} className="text-blue-500" />}
                        {ev.local}
                      </div>
                      {isPast && <div className="flex items-center gap-2 text-green-500 font-bold"><CheckCircle2 size={14} /> Concluído</div>}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}