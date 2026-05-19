"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LifeBuoy, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, Send, Plus, X, Search, Loader2,
  ShieldCheck, User, Filter, ArrowRight
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function SupportPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  // Estados do Formulário
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Dúvida Pedagógica");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REFINAMENTO UNIFORME: Rastreador de Direcção para a Calha de Néon (O Cometa)
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

  const isAdmin = profile?.role === 'super-admin';

  useEffect(() => {
    fetchTickets();
    const channel = supabase.channel('tickets-live').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchTickets()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  async function fetchTickets() {
    if (!profile) return;
    setLoading(true);
    
    let query = supabase.from('tickets').select('*, profiles(first_name, last_name, role)');
    
    // Se não for admin, vê apenas os seus próprios pedidos
    if (!isAdmin) {
      query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) setTickets(data);
    setLoading(false);
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('tickets').insert([{
      user_id: profile.id,
      subject,
      category,
      description,
      status: 'Pendente'
    }]);

    if (!error) {
      setIsModalOpen(false);
      setSubject("");
      setDescription("");
      fetchTickets();
    }
    setIsSubmitting(false);
  };

  const updateTicketStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
    if (!error) fetchTickets();
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "Todos" || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, filterStatus]);

  if (profileLoading || loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col max-w-[1400px] mx-auto pt-24 pb-10 px-10 md:pl-48 relative z-10 selection:bg-blue-500/30 overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-native-scroll::-webkit-scrollbar { width: 2px; }
        .hide-native-scroll::-webkit-scrollbar-track { background: transparent; }
        .hide-native-scroll::-webkit-scrollbar-thumb { background: transparent; }
      `}} />

      {/* HEADER DE SUPORTE OPERACIONAL */}
      <header className="mb-10 flex flex-col lg:flex-row justify-between items-end gap-10 shrink-0">
        <div className="space-y-4 text-left">
          <p className="text-[9px] tracking-[1em] text-blue-500 uppercase font-black italic">Technical Assistance</p>
          <h1 className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none">
            Suporte & <span className="opacity-40 not-italic font-bold">Auditoria</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-xs group">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="PESQUISAR TICKET..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-full pl-12 pr-6 py-4 text-[10px] text-white uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {!isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 px-8 py-4 bg-white text-black text-[10px] uppercase font-black tracking-widest rounded-full shadow-xl border-0"
            >
              <Plus size={16} /> Abrir Ticket
            </motion.button>
          )}
        </div>
      </header>

      <div className="flex-1 relative flex gap-8 min-h-0">
        <div className="flex-1 overflow-y-auto hide-native-scroll pb-10 pr-2" onScroll={handleScroll}>
          
          {/* PAINEL DE ESTADOS */}
          <div className="flex gap-4 mb-8">
            {["Todos", "Pendente", "Em Processo", "Resolvido"].map(st => (
              <button 
                key={st} onClick={() => setFilterStatus(st)}
                className={`px-6 py-2 rounded-xl text-[8px] uppercase tracking-widest font-black border transition-all ${filterStatus === st ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "bg-white/[0.02] border-white/5 text-white/30 hover:text-white"}`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((ticket, index) => (
                <motion.div 
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-8 rounded-[3rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl group hover:border-blue-500/30 transition-all duration-700 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-4 text-left flex-1">
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-black tracking-widest ${
                          ticket.status === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          ticket.status === 'Em Processo' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {ticket.status}
                        </div>
                        <span className="text-[9px] text-white/20 font-mono italic">{ticket.category} // #{ticket.id.slice(0,5).toUpperCase()}</span>
                      </div>
                      
                      <h3 className="text-2xl font-light text-white uppercase tracking-tighter italic leading-none group-hover:text-blue-400 transition-colors">{ticket.subject}</h3>
                      <p className="text-[11px] text-white/40 uppercase tracking-widest leading-relaxed max-w-2xl">{ticket.description}</p>
                      
                      {isAdmin && (
                        <div className="pt-4 flex items-center gap-4 border-t border-white/5">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><User size={14}/></div>
                          <p className="text-[9px] text-white/60 uppercase tracking-widest">Solicitante: <span className="text-white font-black">{ticket.profiles.first_name} {ticket.profiles.last_name}</span></p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-[8px] text-white/20 uppercase tracking-widest font-mono mb-1">Abertura do Processo</p>
                        <p className="text-[10px] text-white font-black uppercase tracking-widest italic">{new Date(ticket.created_at).toLocaleDateString('pt-PT')}</p>
                      </div>

                      {isAdmin && ticket.status !== 'Resolvido' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateTicketStatus(ticket.id, 'Em Processo')} className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"><Clock size={16}/></button>
                          <button onClick={() => updateTicketStatus(ticket.id, 'Resolvido')} className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle2 size={16}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTickets.length === 0 && (
            <div className="py-40 text-center opacity-10 uppercase tracking-[1em] text-[10px]">Sem Incidências Registadas</div>
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

      {/* MODAL DE NOVO TICKET (APENAS PARA UTILIZADORES) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-zinc-950/90 border border-white/10 p-12 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors bg-transparent border-0 outline-none"><X size={20}/></button>
              
              <h2 className="text-3xl font-light text-white uppercase tracking-tighter italic mb-8 flex items-center gap-4"><LifeBuoy className="text-blue-500"/> Protocolo de Ajuda</h2>
              
              <form onSubmit={handleCreateTicket} className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Assunto do Incidente</label>
                  <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all" placeholder="EX: ACESSO AO REPOSITÓRIO..." />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-[10px] uppercase tracking-widest text-white outline-none border-0">
                    <option className="bg-zinc-900">Dúvida Pedagógica</option>
                    <option className="bg-zinc-900">Problema Técnico</option>
                    <option className="bg-zinc-900">Sugestão de Melhoria</option>
                    <option className="bg-zinc-900">Outros</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Descrição Detalhada</label>
                  <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all resize-none" placeholder="DESCREVA O FACTO..." />
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-500 transition-all shadow-2xl flex justify-center items-center gap-3 border-0 mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Send size={16}/> Transmitir Ticket</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}