"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy, Clock, CheckCircle2, Send, Plus, X, Search, Loader2, User,
  ChevronRight, MessageSquare, AlertCircle, RefreshCw, Pencil, Trash2, Check
} from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  Pendente:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Em Processo": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Resolvido:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

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

  // Painel de detalhe / conversa
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [msgActionLoading, setMsgActionLoading] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  async function fetchTickets() {
    if (!user) return;
    setLoading(true);
    let url = "/api/db/tickets?orderBy=created_at&ascending=false&select=*,profiles(first_name,last_name)";
    if (!isAdmin) url += `&eq.user_id=${user.id}`;
    const res = await fetch(url);
    const { data } = await res.json();
    setTickets(data ?? []);
    setLoading(false);
  }

  async function fetchMessages(ticketId: string) {
    const res = await fetch(`/api/db/ticket_mensagens?eq.ticket_id=${ticketId}&orderBy=created_at&ascending=true&select=*,profiles(first_name,last_name,role)`);
    const { data } = await res.json();
    setMessages(data ?? []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openTicket(ticket: any) {
    setSelectedTicket(ticket);
    setMsgText("");
    fetchMessages(ticket.id);
  }

  function closeTicket() {
    setSelectedTicket(null);
    setMessages([]);
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

  const handleSendMessage = async () => {
    if (!msgText.trim() || !user || !selectedTicket) return;
    setMsgSubmitting(true);
    await fetch("/api/db/ticket_mensagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: selectedTicket.id, user_id: user.id, content: msgText.trim() }),
    });
    setMsgText("");
    await fetchMessages(selectedTicket.id);
    setMsgSubmitting(false);
  };

  function startEditMessage(msg: any) {
    setEditingMsgId(msg.id);
    setEditText(msg.content);
  }

  function cancelEditMessage() {
    setEditingMsgId(null);
    setEditText("");
  }

  async function handleSaveEditMessage(msg: any) {
    if (!editText.trim() || !user || !selectedTicket) return;
    setMsgActionLoading(msg.id);
    await fetch("/api/db/ticket_mensagens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: { content: editText.trim() },
        eq: isAdmin ? { id: msg.id } : { id: msg.id, user_id: user.id },
      }),
    });
    setEditingMsgId(null);
    setEditText("");
    await fetchMessages(selectedTicket.id);
    setMsgActionLoading(null);
  }

  async function handleDeleteMessage(msg: any) {
    if (!user || !selectedTicket) return;
    if (!confirm("Eliminar esta mensagem?")) return;
    setMsgActionLoading(msg.id);
    await fetch("/api/db/ticket_mensagens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eq: isAdmin ? { id: msg.id } : { id: msg.id, user_id: user.id } }),
    });
    await fetchMessages(selectedTicket.id);
    setMsgActionLoading(null);
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    setStatusUpdating(true);
    await fetch("/api/db/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: { status }, eq: { id: selectedTicket.id } }),
    });
    const updated = { ...selectedTicket, status };
    setSelectedTicket(updated);
    setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, status } : t));
    setStatusUpdating(false);
  };

  const filteredTickets = useMemo(() => tickets.filter((t) => {
    const matchSearch = t.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "Todos" || t.status === filterStatus;
    return matchSearch && matchStatus;
  }), [tickets, searchTerm, filterStatus]);

  // Auto-selecciona o primeiro ticket ao carregar
  useEffect(() => {
    if (!loading && tickets.length > 0 && !selectedTicket) {
      openTicket(tickets[0]);
    }
  }, [loading, tickets]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex gap-3 h-full w-full min-h-0">

      {/* ── Coluna esquerda: lista de tickets ── */}
      <div className={`flex flex-col gap-3 min-h-0 shrink-0 c-bg2 border c-br rounded-xl p-3 ${selectedTicket ? "hidden lg:flex w-72 xl:w-80" : "flex-1 lg:w-80 lg:flex-none"}`}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-xs font-semibold c-tx">Tickets</p>
            <p className="text-[10px] c-tx5">{tickets.filter(t => t.status === "Pendente").length} pendente{tickets.filter(t => t.status === "Pendente").length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-[11px] c-tx font-medium hover:bg-blue-500 transition-colors whitespace-nowrap">
            <Plus size={12} /> Novo
          </button>
        </div>

        {/* Pesquisa */}
        <div className="relative shrink-0">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="pl-8 pr-3 py-2 rounded-lg c-s1 border c-br text-xs c-tx placeholder:c-tx4 outline-none focus:border-blue-500/50 w-full transition-colors" />
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 flex-wrap shrink-0">
          {["Todos", "Pendente", "Em Processo", "Resolvido"].map((st) => (
            <button key={st} onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${filterStatus === st ? "bg-blue-600 text-white" : "c-s1 c-tx4 border c-br hc-s2 hc-tx"}`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((ticket, index) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.02 }}
                onClick={() => openTicket(ticket)}
                className={`px-3 py-3 rounded-xl cursor-pointer transition-all border-l-2 group ${
                  selectedTicket?.id === ticket.id
                    ? "c-s1 border-l-blue-500 bg-blue-500/5"
                    : "border-l-transparent hc-s1"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLE[ticket.status] ?? "bg-white/5 c-tx4"}`}>
                        {ticket.status}
                      </span>
                      <span className="text-[9px] c-tx5 shrink-0">{new Date(ticket.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <p className={`text-xs leading-snug truncate ${selectedTicket?.id === ticket.id ? "font-semibold c-tx" : "font-medium c-tx2"}`}>{ticket.subject}</p>
                    <p className="text-[10px] c-tx5 truncate mt-0.5">{ticket.description}</p>
                    {isAdmin && ticket.profiles && (
                      <p className="text-[10px] c-tx5 mt-0.5">{ticket.profiles.first_name} {ticket.profiles.last_name}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTickets.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xs c-tx5">Sem tickets</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Coluna direita: detalhe do ticket (sempre visível) ── */}
      <div className="flex-1 flex flex-col min-h-0 c-bg2 border c-br rounded-xl overflow-hidden">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl c-s1 border c-br flex items-center justify-center">
              <LifeBuoy size={28} className="c-tx5" strokeWidth={1} />
            </div>
            <div>
              <p className="text-sm font-medium c-tx3">Selecciona um ticket</p>
              <p className="text-xs c-tx5 mt-1">Ou abre um novo para pedir ajuda</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors">
              <Plus size={14} /> Abrir ticket
            </button>
          </div>
        ) : (<>
            {/* Header do ticket */}
            <div className="px-5 py-4 border-b c-br shrink-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_STYLE[selectedTicket.status] ?? "bg-white/5 c-tx4 c-br2"}`}>
                      {selectedTicket.status}
                    </span>
                    <span className="text-[10px] c-tx4">{selectedTicket.category}</span>
                    <span className="text-[10px] c-tx5">{new Date(selectedTicket.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                  <h3 className="text-sm font-semibold c-tx">{selectedTicket.subject}</h3>
                  {selectedTicket.profiles && (
                    <p className="text-xs c-tx4 mt-0.5">{selectedTicket.profiles.first_name} {selectedTicket.profiles.last_name}</p>
                  )}
                </div>
                <button onClick={closeTicket} className="lg:hidden c-tx4 hc-tx shrink-0"><X size={16} /></button>
              </div>

              {/* Descrição original */}
              <div className="c-s1 rounded-lg px-3 py-2.5">
                <p className="text-[10px] c-tx4 mb-1 font-medium uppercase tracking-wider">Descrição</p>
                <p className="text-xs c-tx3 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* Mudar estado — só admin */}
              {isAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] c-tx4 mr-1">Alterar estado:</span>
                  {["Pendente", "Em Processo", "Resolvido"].map(st => (
                    <button key={st} onClick={() => handleStatusChange(st)} disabled={statusUpdating || selectedTicket.status === st}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors disabled:opacity-40 ${selectedTicket.status === st ? STATUS_STYLE[st] : "bg-black/30 text-white/60 border-white/15 hover:text-white hover:bg-black/50 backdrop-blur-sm"}`}
                    >
                      {statusUpdating && selectedTicket.status !== st ? <Loader2 size={10} className="animate-spin inline" /> : st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="py-8 text-center">
                  <MessageSquare size={24} className="mx-auto c-tx5 mb-2" strokeWidth={1} />
                  <p className="text-xs c-tx5">Sem mensagens ainda. Inicie a conversa.</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.user_id === user?.id;
                const canManage = isMe || isAdmin;
                const senderName = `${msg.profiles?.first_name || ""} ${msg.profiles?.last_name || ""}`.trim() || "Utilizador";
                const senderRole = msg.profiles?.role;
                const isStaff = senderRole === "admin" || senderRole === "super-admin";
                const isEditing = editingMsgId === msg.id;
                const isLoadingThis = msgActionLoading === msg.id;
                return (
                  <div key={msg.id} className={`flex gap-2.5 group ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isStaff ? "bg-blue-500/20 text-blue-400" : "bg-white/10 c-tx3"}`}>
                      {senderName[0]?.toUpperCase() || "?"}
                    </div>
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] c-tx4">{senderName}</span>
                        {isStaff && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">Suporte</span>}
                        {msg.updated_at && msg.updated_at !== msg.created_at && (
                          <span className="text-[9px] c-tx5 italic">editado</span>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { e.preventDefault(); handleSaveEditMessage(msg); }
                              if (e.key === "Escape") cancelEditMessage();
                            }}
                            autoFocus
                            className="flex-1 c-s1 border c-br rounded-lg px-2.5 py-1.5 text-xs c-tx outline-none focus:border-blue-500/40"
                          />
                          <button onClick={() => handleSaveEditMessage(msg)} disabled={isLoadingThis || !editText.trim()}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40 shrink-0">
                            {isLoadingThis ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                          <button onClick={cancelEditMessage} className="p-1.5 rounded-lg c-tx5 hover:bg-white/5 transition-colors shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${isMe ? "bg-blue-600/20 c-tx2 rounded-tr-sm" : "c-s2 c-tx2 rounded-tl-sm"}`}>
                            {msg.content}
                          </div>
                          {canManage && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditMessage(msg)} title="Editar"
                                className="p-1 rounded-lg c-tx5 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                <Pencil size={11} />
                              </button>
                              <button onClick={() => handleDeleteMessage(msg)} disabled={isLoadingThis} title="Eliminar"
                                className="p-1 rounded-lg c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                                {isLoadingThis ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-[9px] c-tx5">{new Date(msg.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de resposta */}
            {selectedTicket.status !== "Resolvido" ? (
              <div className="px-4 py-3 border-t c-br shrink-0 flex gap-2">
                <input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Escreva uma resposta..."
                  className="flex-1 c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/40"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!msgText.trim() || msgSubmitting}
                  className="px-3 py-2 rounded-lg bg-blue-600 c-tx hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0"
                >
                  {msgSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 border-t c-br shrink-0 flex items-center gap-2 text-xs c-tx4">
                <CheckCircle2 size={13} className="text-emerald-500/50" /> Ticket resolvido
                {isAdmin && (
                  <button onClick={() => handleStatusChange("Em Processo")} className="ml-auto text-[10px] c-tx4 hc-tx flex items-center gap-1">
                    <RefreshCw size={10} /> Reabrir
                  </button>
                )}
              </div>
            )}
        </>)}
      </div>

      {/* Modal criar ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg c-bg border c-br rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b c-br">
              <h3 className="text-base font-semibold c-tx flex items-center gap-2"><LifeBuoy size={16} className="text-blue-400" /> Abrir ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="c-tx4 hc-tx"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Assunto</label>
                <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Acesso ao repositório..." className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none">
                  {["Dúvida Pedagógica","Problema Técnico","Sugestão de Melhoria","Outros"].map(c => <option key={c} className="c-bg">{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Descrição</label>
                <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema..." className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border c-br text-sm c-tx3">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
