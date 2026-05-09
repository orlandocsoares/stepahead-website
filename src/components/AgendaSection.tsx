"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Calendar, MapPin, Clock, Loader2, ArrowRight } from "lucide-react";

export function AgendaSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgenda() {
      // 1. BUSCAR EVENTOS (Ordenados pela data mais próxima)
      const { data, error } = await supabase
        .from('agenda_atividades')
        .select('*')
        .order('data_evento', { ascending: true });

      if (!error && data) setEvents(data);
      setLoading(false);
    }

    fetchAgenda();

    // 2. SINCRONIZAÇÃO EM TEMPO REAL
    const channel = supabase.channel('agenda-live')
      .on('postgres_changes', { event: '*', table: 'agenda_atividades', schema: 'public' }, 
      () => fetchAgenda())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-32 px-10 font-sans">
      
      {/* CABEÇALHO DA SECÇÃO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] tracking-[0.8em] text-blue-500 uppercase font-black italic">Training Timeline // 2026</p>
          <h2 className="text-6xl font-extralight text-white uppercase tracking-tighter leading-none">
            Agenda de <span className="opacity-20 italic serif">Formação</span>
          </h2>
        </div>
        <div className="pb-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 max-w-[300px] text-right leading-relaxed">
            Cronograma atualizado em tempo real das atividades pedagógicas nas províncias.
          </p>
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-white/5" size={40} strokeWidth={1} />
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all duration-700 overflow-hidden"
              >
                {/* DATA HIGHLIGHT */}
                <div className="flex justify-between items-start mb-10">
                  <div className="px-5 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                    {new Date(event.data_evento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="text-white/5 group-hover:text-blue-500/20 transition-colors">
                    <Calendar size={40} strokeWidth={1} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-light text-white leading-tight group-hover:text-blue-100 transition-colors">
                    {event.titulo}
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-widest">
                      <Clock size={14} className="text-blue-500" />
                      {event.hora || "09:00"}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-widest">
                      <MapPin size={14} className="text-blue-500" />
                      {event.local || "Sede do Projecto"}
                    </div>
                  </div>
                </div>

                {/* EFEITO DE HOVER (BRILHO) */}
                <div className="absolute -inset-10 bg-blue-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* ESTADO VAZIO */
        <div className="py-40 text-center border border-dashed border-white/5 rounded-[4rem]">
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/10">Nenhum evento agendado para este período.</p>
        </div>
      )}
    </div>
  );
}