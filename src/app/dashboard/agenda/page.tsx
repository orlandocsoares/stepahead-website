"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, MapPin, Clock, 
  Globe, Lock, CheckCircle2, Loader2, Plus, X, Laptop, Search
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function AgendaPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [events, setEvents] = useState<any[]>([]);
  const [myInscriptions, setMyInscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // PONTO 1: Adicionado filtro textual para a nova barra de pesquisa de eventos
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Matriz de Filtragem Tridimensional
  const [filterLocation, setFilterLocation] = useState<string>("Todas"); 
  const [filterFormat, setFilterFormat] = useState<string>("Todos");     
  const [filterScope, setFilterScope] = useState<string>("Todos");       

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [agendaForm, setAgendaForm] = useState({ 
    titulo: "", 
    formato: "Presencial",
    provincia: "Luanda", 
    tipo: "Global" 
  });

  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current) {
      setScrollDirection('down');
    } else if (currentScrollY < lastScrollY.current) {
      setScrollDirection('up');
    }
    lastScrollY.current = currentScrollY;
  };

  const canManageAgenda = useMemo(() => {
    if (!profile) return false;
    if (profile.role === "super-admin") return true;
    if (!profile.temporary_power || !profile.power_expires_at) return false;
    
    const power = profile.temporary_power.toLowerCase();
    const isNotExpired = new Date(profile.power_expires_at) > new Date();
    
    return isNotExpired && (
      power.includes("agenda") || 
      power.includes("evento") || 
      power.includes("geral") || 
      power.includes("admin")
    );
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const [evs, ins] = await Promise.all([
      supabase.from("agenda_atividades").select("*").order("data_evento", { ascending: true }),
      user ? supabase.from("inscricoes_agenda").select("evento_id").eq("user_id", user.id) : { data: [] }
    ]);

    if (evs.data) setEvents(evs.data);
    if (ins.data) setMyInscriptions(ins.data.map((i: any) => i.evento_id));
    setLoading(false);
  }

  const handleInscription = async (eventoId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Sessão expirada.");

    if (myInscriptions.includes(eventoId)) {
      const { error } = await supabase.from("inscricoes_agenda").delete().eq("user_id", user.id).eq("evento_id", eventoId);
      if (!error) setMyInscriptions(prev => prev.filter(id => id !== eventoId));
    } else {
      const { error } = await supabase.from("inscricoes_agenda").insert([{ user_id: user.id, evento_id: eventoId }]);
      if (!error) setMyInscriptions(prev => [...prev, eventoId]);
    }
  };

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalLocal = agendaForm.formato === "Online" ? "Online" : agendaForm.provincia;

    const { error } = await supabase.from("agenda_atividades").insert([{
      titulo: agendaForm.titulo,
      local: finalLocal,
      data_evento: (e.target as any).data_evento.value,
      tipo: agendaForm.tipo
    }]);

    if (!error) {
      setIsAddModalOpen(false);
      setAgendaForm({ titulo: "", formato: "Presencial", provincia: "Luanda", tipo: "Global" });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const isOnline = e.local === "Online";

      const matchesSearch = e.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || e.local?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = filterLocation === "Todas" || (!isOnline && e.local === filterLocation);
      const matchesFormat = filterFormat === "Todos" || (filterFormat === "Online" && isOnline) || (filterFormat === "Presencial" && !isOnline);
      const matchesScope = filterScope === "Todos" || e.tipo === filterScope;

      return matchesSearch && matchesLocation && matchesFormat && matchesScope;
    });
  }, [events, searchTerm, filterLocation, filterFormat, filterScope]);

  if (profileLoading || loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col max-w-[1400px] mx-auto pt-24 pb-10 px-4 md:px-10 md:pl-48 relative z-10 selection:bg-blue-500/30 overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-native-scroll::-webkit-scrollbar { width: 2px; }
        .hide-native-scroll::-webkit-scrollbar-track { background: transparent; }
        .hide-native-scroll::-webkit-scrollbar-thumb { background: transparent; }
      `}} />

      {/* PONTO 1: NOVO CABEÇALHO REESTRUTURADO (Título no topo, pesquisa e filtros em linha abaixo) */}
      <header className="mb-10 flex flex-col gap-8 shrink-0 w-full text-left">
        <div className="w-full border-b border-white/5 pb-4">
          <p className="text-[9px] tracking-[1em] text-blue-500 uppercase font-black italic mb-2">Temporal Schedule</p>
          <h1 className="text-5xl md:text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
            Agenda <span className="opacity-40 not-italic font-bold">Operacional</span>
          </h1>
        </div>

        {/* LINHA DE CONTROLOS TOTALMENTE VISÍVEL ABAIXO DO TÍTULO */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 w-full">
          
          {/* BARRA DE PESQUISA EXCLUSIVA DE EVENTOS */}
          <div className="relative w-full sm:max-w-xs group">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="PESQUISAR EVENTO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-full pl-12 pr-6 py-4 text-[10px] text-white uppercase tracking-widest outline-none focus:border-blue-500 transition-all font-mono"
            />
          </div>

          {/* MATRIZ DE FILTRAGEM TRIDIMENSIONAL */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-white/[0.01] border border-white/5 p-2 rounded-[2rem] backdrop-blur-3xl">
            
            <div className="flex flex-col gap-1 p-2 bg-black/20 rounded-xl border border-white/5">
              <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold text-left pl-2">Localização</span>
              <div className="flex gap-1">
                {["Todas", "Luanda", "Bié"].map((loc) => (
                  <button 
                    key={loc} disabled={filterFormat === "Online" && loc !== "Todas"}
                    onClick={() => setFilterLocation(loc)} 
                    className={`px-4 py-1.5 rounded-lg text-[8px] uppercase tracking-widest font-black transition-all duration-300 ${filterFormat === "Online" && loc !== "Todas" ? "opacity-20 cursor-not-allowed" : ""} ${filterLocation === loc ? "bg-white text-black font-bold" : "text-white/40 hover:text-white"}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 p-2 bg-black/20 rounded-xl border border-white/5">
              <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold text-left pl-2">Formato</span>
              <div className="flex gap-1">
                {["Todos", "Presencial", "Online"].map((form) => (
                  <button 
                    key={form} 
                    onClick={() => {
                      setFilterFormat(form);
                      if (form === "Online") setFilterLocation("Todas");
                    }} 
                    className={`px-4 py-1.5 rounded-lg text-[8px] uppercase tracking-widest font-black transition-all duration-300 ${filterFormat === form ? "bg-blue-500 text-white font-bold" : "text-white/40 hover:text-white"}`}
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 p-2 bg-black/20 rounded-xl border border-white/5">
              <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold text-left pl-2">Âmbito</span>
              <div className="flex gap-1">
                {["Todos", "Global", "Restrito"].map((sc) => (
                  <button 
                    key={sc} 
                    onClick={() => setFilterScope(sc)} 
                    className={`px-4 py-1.5 rounded-lg text-[8px] uppercase tracking-widest font-black transition-all duration-300 ${filterScope === sc ? "bg-emerald-500 text-white font-bold" : "text-white/40 hover:text-white"}`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            {canManageAgenda && (
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-black text-[9px] uppercase font-black tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all border-0 shadow-xl"
              >
                <Plus size={14} /> Planear Evento
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* CORPO DA AGENDA */}
      <div className="flex-1 relative flex gap-8 min-h-0">
        <div className="flex-1 overflow-y-auto hide-native-scroll pb-10 pr-2" onScroll={handleScroll}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((item, index) => {
                const isRegistered = myInscriptions.includes(item.id);
                const isRestricted = item.tipo === "Restrito";
                const isEventOnline = item.local === "Online";
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-8 rounded-[3rem] bg-white/[0.01] border border-white/5 backdrop-blur-2xl flex flex-col justify-between group hover:bg-black/40 hover:border-blue-500/20 transition-all duration-700 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-15 transition-opacity">
                      {isRestricted ? <Lock size={40} /> : <Globe size={40} />}
                    </div>

                    <div className="space-y-6 text-left relative z-10">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className={`px-4 py-1 rounded-full text-[8px] uppercase font-black tracking-[0.15em] ${isRestricted ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                          {item.tipo}
                        </div>
                        <div className={`px-4 py-1 rounded-full text-[8px] uppercase font-black tracking-[0.15em] ${isEventOnline ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                          {isEventOnline ? "Digital / Online" : "Presencial"}
                        </div>
                        <span className="text-[8.5px] text-white/20 font-mono italic ml-auto">REF_{item.id.slice(0,5).toUpperCase()}</span>
                      </div>

                      <h3 className="text-3xl font-light text-white uppercase tracking-tighter italic leading-none group-hover:text-blue-400 transition-colors">
                        {item.titulo}
                      </h3>

                      <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="flex items-center gap-3 text-white/40 text-[10px] uppercase tracking-widest font-medium">
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5"><CalendarIcon size={13} className="text-blue-500"/></div>
                          {new Date(item.data_evento).toLocaleDateString("pt-PT")}
                        </div>
                        <div className="flex items-center gap-3 text-white/40 text-[10px] uppercase tracking-widest font-medium">
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                            {isEventOnline ? <Laptop size={13} className="text-purple-500"/> : <MapPin size={13} className="text-emerald-500"/>}
                          </div>
                          {item.local}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleInscription(item.id)}
                      className={`mt-10 w-full py-5 rounded-[1.5rem] text-[9px] uppercase font-black tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${isRegistered ? "bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.25)]" : "bg-white/5 text-white/30 border border-white/5 hover:bg-white hover:text-black"}`}
                    >
                      {isRegistered ? <><CheckCircle2 size={15}/> Acesso Confirmado</> : "Garantir Presença no Acto"}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredEvents.length === 0 && !loading && (
            <div className="py-40 text-center opacity-10 uppercase tracking-[0.8em] text-[10px] italic">
              Nenhuma Actividade Encontrada na Matriz
            </div>
          )}
        </div>

        {/* CALHA DE SCROLL NÉON INTEGRADA (O COMETA) */}
        <div className="w-[3px] rounded-full bg-white/[0.02] relative overflow-hidden shrink-0 hidden md:block mb-10">
          <motion.div
            key={scrollDirection}
            animate={scrollDirection === 'down' ? { top: ['-20%', '120%'] } : { top: ['120%', '-20%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            className={`absolute left-0 w-full h-[15%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] ${scrollDirection === 'down' ? 'bg-gradient-to-b from-transparent via-blue-500/80 to-white' : 'bg-gradient-to-t from-transparent via-blue-500/80 to-white'}`}
          />
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO ADAPTADO */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-lg bg-zinc-950/80 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors bg-transparent border-0 outline-none"><X size={20} /></button>
              
              <h2 className="text-2xl font-light text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3"><CalendarIcon className="text-blue-500"/> Planear Actividade</h2>
              
              <form onSubmit={handleCreateAgenda} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Título da Actividade</label>
                  <input required type="text" name="titulo" value={agendaForm.titulo} onChange={e => setAgendaForm({...agendaForm, titulo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Módulo de Supervisão Avançada..." />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Formato</label>
                    <select value={agendaForm.formato} onChange={e => setAgendaForm({...agendaForm, formato: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 cursor-pointer border-0">
                      <option value="Presencial" className="bg-zinc-900">Presencial</option>
                      <option value="Online" className="bg-zinc-900">Online / Digital</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Data Realização</label>
                    <input required type="date" name="data_evento" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {agendaForm.formato === "Presencial" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 text-left overflow-hidden"
                    >
                      <label className="text-[9px] uppercase tracking-widest text-white/40">Província Alvo</label>
                      <select value={agendaForm.provincia} onChange={e => setAgendaForm({...agendaForm, provincia: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 cursor-pointer border-0">
                        <option value="Luanda" className="bg-zinc-900">Luanda</option>
                        <option value="Bié" className="bg-zinc-900">Bié</option>
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Nível de Acesso (Âmbito)</label>
                  <select value={agendaForm.tipo} onChange={e => setAgendaForm({...agendaForm, tipo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 cursor-pointer border-0">
                    <option value="Global" className="bg-zinc-900">Global (Aberto a todos)</option>
                    <option value="Restrito" className="bg-zinc-900">Restrito (Apenas Formadores)</option>
                  </select>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all mt-4 border-0 flex items-center justify-center shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Injectar Sinal na Rede"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}