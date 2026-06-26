"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy, Clock, CheckCircle2, Send, Plus, X, Search, Loader2, User
} from "lucide-react";

export default function SupportPage() {
  const { user } = useAdminUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Dúvida Pedagógica");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  async function fetchTickets() {
    if (!user) return;
    setLoading(true);
    let url = "/api/db/tickets?orderBy=created_at&ascending=false";
    if (!isAdmin) url += `&eq.user_id=${user.id}`;
    const res = await fetch(url);
    const { data } = await res.json();
    setTickets(data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (user) fetchTickets(); }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description || !user) return;
    setIsSubmitting(true);
    await fetch("/api/db/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, subject, category, description, status: "Pendente" }),
    });
    setIsModalOpen(false);
    setSubject(""); setDescription("");
    fetchTickets();
    setIsSubmitting(false);
  };

  const updateTicketStatus = async (id: string, status: string) => {
    await fetch("/api/db/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: { status }, eq: { id } }),
    });
    fetchTickets();
  };

  const filteredTickets = useMemo(() => tickets.filter((t) => {
    const matchSearch = t.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "Todos" || t.status === filterStatus;
    return matchSearch && matchStatus;
  }), [tickets, searchTerm, filterStatus]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-blue-400/60 italic mb-1 font-medium">
            Technical Assistance
          </p>
          <h2 className="text-4xl font-extralight italic uppercase tracking-tight text-white leading-none">
            Suporte <span className="font-bold text-white/30">&</span> Auditoria
          </h2>
          <p className="text-xs text-white/25 mt-2">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} · {tickets.filter(t => t.status === "Pendente").length} pendente{tickets.filter(t => t.status === "Pendente").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar ticket..." className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 w-48 transition-colors" />
          </div>
          {!isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">
              <Plus size={14} /> Abrir ticket
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["Todos", "Pendente", "Em Processo", "Resolvido"].map((st) => (
          <button key={st} onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === st ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/70"}`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTickets.map((ticket, index) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.04 }}
              className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${ticket.status === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-400' : ticket.status === 'Em Processo' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-white/20">{ticket.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{ticket.subject}</h3>
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{ticket.description}</p>
                  {isAdmin && ticket.profiles && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center"><User size={10} className="text-blue-400" /></div>
                      <span className="text-xs text-white/40">{ticket.profiles.first_name} {ticket.profiles.last_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                  <p className="text-xs text-white/30">{new Date(ticket.created_at).toLocaleDateString("pt-PT")}</p>
                  {isAdmin && ticket.status !== 'Resolvido' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateTicketStatus(ticket.id, 'Em Processo')} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-colors"><Clock size={13} /></button>
                      <button onClick={() => updateTicketStatus(ticket.id, 'Resolvido')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors"><CheckCircle2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTickets.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/15 italic">
            Sem incidências registadas
          </p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2"><LifeBuoy size={16} className="text-blue-400" /> Abrir ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Assunto</label>
                <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Acesso ao repositório..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  {["Dúvida Pedagógica","Problema Técnico","Sugestão de Melhoria","Outros"].map(c => <option key={c} className="bg-[#0d0d14]">{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Descrição</label>
                <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Send size={13} /> Enviar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
