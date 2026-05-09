"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, MapPin, Clock, 
  ChevronRight, Globe, Lock, CheckCircle2, FileDown, Loader2 
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function AgendaPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [events, setEvents] = useState<any[]>([]);
  const [myInscriptions, setMyInscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Todos"); // Estado de filtragem de localização

  // Executa sempre para garantir que a agenda carrega mesmo sem perfil inicializado
  useEffect(() => {
    fetchData();
  }, [profile, profileLoading]);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Procura sempre as actividades na base de dados (independente do utilizador)
      const { data: evRes, error: evError } = await supabase
        .from("agenda_atividades")
        .select("*")
        .order("data_evento", { ascending: true });

      if (evError) throw evError;
      if (evRes) setEvents(evRes);

      // 2. Se o perfil estiver carregado e activo, procura as respectivas inscrições
      if (profile?.id) {
        const { data: insRes, error: insError } = await supabase
          .from("inscricoes_agenda")
          .select("event_id")
          .eq("user_id", profile.id);

        if (!insError && insRes) {
          setMyInscriptions(insRes.map(i => i.event_id));
        }
      }
    } catch (error) {
      console.error("Erro na leitura da infraestrutura da agenda:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEnroll = async (eventId: string) => {
    if (!profile) {
      alert("Por favor, aceda à sua conta para poder reservar um lugar.");
      return;
    }
    if (myInscriptions.includes(eventId)) return; // Prevenção de acção duplicada

    const { error } = await supabase
      .from("inscricoes_agenda")
      .insert([{ user_id: profile.id, event_id: eventId }]);

    if (!error) {
      setMyInscriptions([...myInscriptions, eventId]);
    } else {
      alert("Erro ao processar inscrição: " + error.message);
    }
  };

  // Filtragem ultra-rápida em memória usando useMemo
  const filteredEvents = useMemo(() => {
    if (filter === "Todos") return events;
    return events.filter(event => event.local === filter);
  }, [events, filter]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={40} strokeWidth={1} />
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto py-24 px-10 md:pl-48 min-h-screen relative z-10">
      
      {/* HEADER DO CRONOGRAMA */}
      <header className="mb-16 space-y-6 text-left">
        <div className="space-y-2">
          <p className="text-[9px] tracking-[0.8em] text-blue-500 uppercase font-black italic">Operação Saber Mais</p>
          <h1 className="text-5xl font-extralight text-white uppercase tracking-tighter italic">
            Cronograma <span className="opacity-40 not-italic font-bold text-white/60">Interactivo</span>
          </h1>
        </div>

        {/* REFINAMENTO: SELEÇÃO DE FILTROS DE LOCALIZAÇÃO EM VIDRO */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {["Todos", "Luanda", "Bié", "Online"].map((loc) => (
            <button
              key={loc}
              onClick={() => setFilter(loc)}
              className={`px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-black transition-all border shrink-0 ${
                filter === loc 
                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105" 
                : "bg-white/5 text-white/40 border-white/10 hover:border-white/30"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </header>

      {/* TIMELINE DE ACTIVIDADES */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => {
            const isEnrolled = myInscriptions.includes(event.id);
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl flex flex-col md:flex-row gap-10 items-center hover:bg-black/40 transition-all duration-700 shadow-2xl"
              >
                {/* DATA ESTILIZADA */}
                <div className="text-center min-w-[100px] py-4 bg-white/5 rounded-3xl border border-white/10 shrink-0">
                  <span className="block text-3xl font-bold text-white leading-none">
                    {new Date(event.data_evento).getDate()}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-blue-400 font-black">
                    {new Date(event.data_evento).toLocaleString('pt-PT', { month: 'short' })}
                  </span>
                </div>

                {/* CONTEÚDO PRINCIPAL */}
                <div className="flex-1 space-y-4 text-left">
                  <div className="flex items-center gap-4">
                    <span className={`text-[8px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${event.tipo === 'Restrito' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' : 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'}`}>
                      {event.tipo === 'Restrito' ? <Lock size={10} className="inline mr-1"/> : <Globe size={10} className="inline mr-1"/>}
                      {event.tipo}
                    </span>
                  </div>
                  <h3 className="text-2xl font-light text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">
                    {event.titulo}
                  </h3>
                  <div className="flex gap-6 text-[10px] text-white/40 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> {event.local}</span>
                    <span className="flex items-center gap-2"><Clock size={12} className="text-blue-500" /> 09:00 - 17:00</span>
                  </div>
                </div>

                {/* ACÇÕES PREMIUM */}
                <div className="flex gap-3 w-full md:w-auto justify-end">
                  {/* Botão de Recursos (Só visível se houver material) */}
                  <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-lg shrink-0">
                    <FileDown size={20} strokeWidth={1.5} />
                  </button>

                  {/* Botão de Inscrição Dinâmico */}
                  <button
                    onClick={() => handleEnroll(event.id)}
                    disabled={isEnrolled}
                    className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all shadow-xl w-full md:w-auto shrink-0 ${
                      isEnrolled 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default" 
                      : "bg-blue-600 text-white border border-blue-400 hover:bg-blue-500 hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isEnrolled ? (
                      <><CheckCircle2 size={16} /> Confirmado</>
                    ) : (
                      "Reservar Lugar"
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem] bg-black/10 backdrop-blur-md">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.5em] italic">Sem actividades planeadas para esta localização.</p>
          </div>
        )}
      </div>
    </div>
  );
}