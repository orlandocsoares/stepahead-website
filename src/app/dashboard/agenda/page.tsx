"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon, MapPin,
  CheckCircle2, Loader2, Plus, X, Laptop, Search,
  Users, ChevronDown, ChevronUp, GraduationCap, BookOpen, ShieldCheck,
  ImagePlus, Clock, Trash2
} from "lucide-react";

const LOCAIS = ["Luanda", "Bié", "Online"];

export default function AgendaPage() {
  const { user } = useAdminUser();
  const [events, setEvents] = useState<any[]>([]);
  const [myInscriptions, setMyInscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("Todos");
  const [filterScope, setFilterScope] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ titulo: "", formato: "Presencial", provincia: "Luanda", tipo: "Global", data_evento: "", endereco: "", acao_formacao_id: "" });
  const [acoesFormacao, setAcoesFormacao] = useState<any[]>([]);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  function handleImagemSelect(file: File | null) {
    setImagemFile(file);
    setImagemPreview(file ? URL.createObjectURL(file) : null);
  }

  const canManage = user?.role === "admin" || user?.role === "formador";
  const isStaff = user?.role === "admin" || user?.role === "super-admin" || user?.role === "formador";

  // Inscritos por evento: { [eventoId]: { total, counts, inscritos?, expanded } }
  const [inscritosMap, setInscritosMap] = useState<Record<string, { total: number; counts: Record<string, number>; inscritos?: any[]; loading?: boolean; expanded?: boolean }>>({});

  async function fetchData() {
    setLoading(true);
    const [evRes, insRes, acoesRes] = await Promise.all([
      fetch("/api/db/agenda_atividades?orderBy=data_evento&ascending=true"),
      user?.id ? fetch(`/api/db/inscricoes_agenda?eq.user_id=${user.id}`) : Promise.resolve(null),
      fetch("/api/acoes-formacao").then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]);
    const { data: evs } = await evRes.json();
    const evList: any[] = evs ?? [];
    setEvents(evList);
    if (insRes) {
      const { data: ins } = await insRes.json();
      setMyInscriptions((ins ?? []).map((i: any) => i.evento_id));
    }
    setAcoesFormacao(acoesRes.data ?? []);
    setLoading(false);
    // Carregar contagens para todos os eventos visíveis
    evList.forEach(ev => fetchInscritos(ev.id, false));
  }

  async function fetchInscritos(eventoId: string, expand: boolean) {
    setInscritosMap(prev => ({
      ...prev,
      [eventoId]: { ...prev[eventoId], loading: true, expanded: expand || prev[eventoId]?.expanded },
    }));
    try {
      const res = await fetch(`/api/eventos/${eventoId}/inscritos`);
      const json = await res.json();
      setInscritosMap(prev => ({
        ...prev,
        [eventoId]: {
          total: json.total ?? 0,
          counts: json.counts ?? {},
          inscritos: json.inscritos,
          loading: false,
          expanded: expand,
        },
      }));
    } catch {
      setInscritosMap(prev => ({ ...prev, [eventoId]: { ...prev[eventoId], loading: false } }));
    }
  }

  async function toggleInscritos(eventoId: string) {
    const cur = inscritosMap[eventoId];
    if (!cur) { fetchInscritos(eventoId, true); return; }
    if (cur.expanded) {
      setInscritosMap(prev => ({ ...prev, [eventoId]: { ...prev[eventoId], expanded: false } }));
    } else {
      if (!cur.inscritos) { fetchInscritos(eventoId, true); }
      else { setInscritosMap(prev => ({ ...prev, [eventoId]: { ...prev[eventoId], expanded: true } })); }
    }
  }

  useEffect(() => { if (user) fetchData(); }, [user]);

  async function handleInscription(eventoId: string) {
    if (!user?.id) return;
    const evento = events.find(e => e.id === eventoId);
    if (myInscriptions.includes(eventoId)) {
      await fetch("/api/db/inscricoes_agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eq: { user_id: user.id, evento_id: eventoId } }),
      });
      if (evento?.acao_formacao_id) {
        await fetch(`/api/acoes-formacao/${evento.acao_formacao_id}/inscricoes`, { method: "DELETE" });
      }
      setMyInscriptions((p) => p.filter((id) => id !== eventoId));
      setInscritosMap(prev => {
        const cur = prev[eventoId];
        if (!cur) return prev;
        const myRole = user.role ?? "formando";
        const newCounts = { ...cur.counts, [myRole]: Math.max(0, (cur.counts[myRole] ?? 0) - 1) };
        return { ...prev, [eventoId]: { ...cur, total: Math.max(0, cur.total - 1), counts: newCounts, inscritos: cur.inscritos?.filter(i => i.id !== user.id) } };
      });
    } else {
      await fetch("/api/db/inscricoes_agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, evento_id: eventoId }),
      });
      if (evento?.acao_formacao_id) {
        const res = await fetch(`/api/acoes-formacao/${evento.acao_formacao_id}/inscricoes`, { method: "POST" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          alert(json?.error ?? "Não foi possível inscrever na Acção de Formação associada.");
        } else if (json?.data?.status === "pendente") {
          alert("Inscrição enviada — aguarda confirmação do formador responsável.");
        }
      }
      setMyInscriptions((p) => [...p, eventoId]);
      setInscritosMap(prev => {
        const cur = prev[eventoId] ?? { total: 0, counts: {} };
        const myRole = user.role ?? "formando";
        const newCounts = { ...cur.counts, [myRole]: (cur.counts[myRole] ?? 0) + 1 };
        return { ...prev, [eventoId]: { ...cur, total: cur.total + 1, counts: newCounts } };
      });
    }
  }

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(eventoId: string) {
    if (!confirm("Eliminar este evento? Esta acção não pode ser desfeita.")) return;
    setDeletingId(eventoId);
    const res = await fetch("/api/db/agenda_atividades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eq: { id: eventoId } }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      alert(json?.error?.message ?? "Não foi possível eliminar o evento.");
      setDeletingId(null);
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== eventoId));
    setDeletingId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const local = form.formato === "Online" ? "Online" : form.provincia;

    let imagem_url: string | undefined;
    if (imagemFile) {
      const sanitized = imagemFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `${Date.now()}_${sanitized}`;
      const uploadForm = new FormData();
      uploadForm.append("bucket", "eventos"); uploadForm.append("path", fileName); uploadForm.append("file", imagemFile);
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: uploadForm });
      if (uploadRes.ok) imagem_url = `/storage/v1/object/public/eventos/${fileName}`;
    }

    const res = await fetch("/api/db/agenda_atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: form.titulo, local, data_evento: form.data_evento, tipo: form.tipo,
        endereco: form.formato === "Presencial" ? (form.endereco || null) : null,
        acao_formacao_id: form.acao_formacao_id || null,
        criado_por: user?.id ?? null,
        ...(imagem_url ? { imagem_url } : {}),
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      alert(json?.error?.message ?? "Erro ao criar o evento.");
      setIsSubmitting(false);
      return;
    }
    setIsModalOpen(false);
    setForm({ titulo: "", formato: "Presencial", provincia: "Luanda", tipo: "Global", data_evento: "", endereco: "", acao_formacao_id: "" });
    handleImagemSelect(null);
    fetchData();
    setIsSubmitting(false);
  }

  const [showArchive, setShowArchive] = useState(false);

  const now = new Date(); now.setHours(0,0,0,0);

  function getDaysUntil(dateStr: string) {
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - now.getTime()) / 86400000);
  }

  function getUrgency(days: number) {
    if (days < 0) return "past";
    if (days === 0) return "today";
    if (days <= 3) return "urgent";
    if (days <= 7) return "soon";
    if (days <= 30) return "upcoming";
    return "future";
  }

  const allFiltered = useMemo(() => events.filter((e) => {
    const isOnline = e.local === "Online";
    const matchSearch = e.titulo?.toLowerCase().includes(search.toLowerCase());
    const matchFormat = filterFormat === "Todos" || (filterFormat === "Online" && isOnline) || (filterFormat === "Presencial" && !isOnline);
    const matchScope = filterScope === "Todos" || e.tipo === filterScope;
    return matchSearch && matchFormat && matchScope;
  }), [events, search, filterFormat, filterScope]);

  const filtered = allFiltered.filter(e => getDaysUntil(e.data_evento) >= 0);
  const archived = allFiltered.filter(e => getDaysUntil(e.data_evento) < 0);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 w-full">
      <div id="tour-agenda-header" className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold c-tx">Agenda</h2>
          <p className="text-sm c-tx3 mt-0.5">{filtered.length} actividade{filtered.length !== 1 ? "s" : ""} {archived.length > 0 ? `· ${archived.length} arquivada${archived.length !== 1 ? "s" : ""}` : ""}.</p>
        </div>
        <div id="tour-agenda-filters" className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar..." className="pl-9 pr-4 py-2 rounded-lg c-s1 border c-br text-sm c-tx placeholder:c-tx4 outline-none focus:border-blue-500/50 w-44 transition-colors" />
          </div>
          <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="px-3 py-2 rounded-lg c-s1 border c-br text-sm c-tx2 outline-none">
            {["Todos", "Presencial", "Online"].map((f) => <option key={f} value={f} className="c-bg">{f}</option>)}
          </select>
          <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)} className="px-3 py-2 rounded-lg c-s1 border c-br text-sm c-tx2 outline-none">
            {["Todos", "Global", "Restrito"].map((s) => <option key={s} value={s} className="c-bg">{s}</option>)}
          </select>
          {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors">
              <Plus size={14} /> Novo evento
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && archived.length === 0 && (
        <div className="py-20 text-center text-sm c-tx5">Nenhuma actividade encontrada.</div>
      )}

      <div id="tour-events-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, index) => {
            const isRegistered = myInscriptions.includes(item.id);
            const isOnline = item.local === "Online";
            const days = getDaysUntil(item.data_evento);
            const urgency = getUrgency(days);

            const accentBar =
              urgency === "today"   ? "bg-emerald-500" :
              urgency === "urgent"  ? "bg-red-500" :
              urgency === "soon"    ? "bg-amber-500" :
              urgency === "upcoming"? "bg-blue-500" : "bg-white/10";

            const borderClass =
              urgency === "today"  ? "border-emerald-500/40" :
              urgency === "urgent" ? "border-red-500/30" :
              urgency === "soon"   ? "border-amber-500/30" : "c-br";

            const countdownText =
              urgency === "today"  ? "Hoje" :
              urgency === "past"   ? "Concluído" :
              `Faltam ${days} dia${days !== 1 ? "s" : ""}`;

            const countdownColorClass =
              urgency === "today"  ? "text-emerald-400" :
              urgency === "urgent" ? "text-red-400" :
              urgency === "soon"   ? "text-amber-400" : "text-blue-400";

            const dataObj = new Date(item.data_evento);

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.04 }}
                className={`c-bg2 border ${borderClass} rounded-xl overflow-hidden flex flex-col hover:border-white/[0.15] transition-colors`}
              >
                {/* Cartaz do evento (se existir) */}
                {item.imagem_url ? (
                  <div className="w-full aspect-[16/9] bg-black/30 overflow-hidden">
                    <img src={item.imagem_url} alt={item.titulo} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`h-1 w-full ${accentBar}`} />
                )}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.tipo === "Restrito" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{item.tipo}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${isOnline ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"}`}>{isOnline ? "Online" : "Presencial"}</span>
                    {item.acao_formacao_id && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400">
                        <GraduationCap size={10} /> {acoesFormacao.find((a: any) => a.id === item.acao_formacao_id)?.designacao ?? "Acção de Formação"}
                      </span>
                    )}
                    {(isAdmin || item.criado_por === user?.id) && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="Eliminar evento"
                        className="ml-auto p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Bloco de data em destaque */}
                    <div className={`flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-xl border ${borderClass} c-s1`}>
                      <span className="text-xl font-black leading-none c-tx">{dataObj.getDate()}</span>
                      <span className="text-[9px] uppercase tracking-wider c-tx4 mt-0.5">{dataObj.toLocaleDateString("pt-PT", { month: "short" })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold c-tx leading-snug">{item.titulo}</p>
                      {urgency !== "future" && (
                        <p className={`flex items-center gap-1.5 text-xs font-bold mt-1 ${countdownColorClass} ${urgency === "today" ? "animate-pulse" : ""}`}>
                          <Clock size={12} /> {countdownText}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs c-tx3">
                    <span className="flex items-center gap-1.5"><CalendarIcon size={12} className="text-blue-400" />{dataObj.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                    <span className="flex items-center gap-1.5">{isOnline ? <Laptop size={12} className="text-purple-400" /> : <MapPin size={12} className="text-emerald-400" />}{item.local}{item.endereco ? ` — ${item.endereco}` : ""}</span>
                  </div>
                  {/* Contador de inscritos */}
                  {(() => {
                    const info = inscritosMap[item.id];
                    const total = info?.total ?? 0;
                    const formandos = info?.counts?.formando ?? 0;
                    const formadores = (info?.counts?.formador ?? 0) + (info?.counts?.admin ?? 0) + (info?.counts?.["super-admin"] ?? 0);
                    return (
                      <div>
                        <button
                          onClick={() => isStaff && toggleInscritos(item.id)}
                          className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors ${isStaff ? "hc-s2 cursor-pointer" : "cursor-default"}`}
                        >
                          <Users size={12} className="c-tx5 shrink-0" />
                          {total === 0
                            ? <span className="text-[11px] c-tx5">Sem inscrições ainda</span>
                            : <>
                                <span className="text-[11px] c-tx3 font-medium">{total} inscrito{total !== 1 ? "s" : ""}</span>
                                {formandos > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{formandos} formando{formandos !== 1 ? "s" : ""}</span>}
                                {formadores > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{formadores} formador{formadores !== 1 ? "es" : ""}</span>}
                              </>
                          }
                          {isStaff && total > 0 && (
                            <span className="ml-auto c-tx5">
                              {info?.expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </span>
                          )}
                        </button>

                        {/* Lista expandível — só staff */}
                        <AnimatePresence>
                          {isStaff && info?.expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="border-t c-br mt-1 pt-2 space-y-1 max-h-40 overflow-y-auto">
                                {info.loading && <div className="flex justify-center py-2"><Loader2 size={12} className="animate-spin c-tx4" /></div>}
                                {(info.inscritos ?? []).map(p => (
                                  <div key={p.id} className="flex items-center gap-2 px-1 py-0.5">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                      p.role === "formando" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                                    }`}>
                                      {p.first_name?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-[11px] c-tx3 flex-1 truncate">{p.first_name} {p.last_name}</span>
                                    {p.role !== "formando" && <span className="text-[9px] c-tx5">{p.role}</span>}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  <button onClick={() => handleInscription(item.id)}
                    className={`mt-auto w-full py-2 rounded-lg text-xs font-medium transition-colors ${isRegistered ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "c-s1 c-tx3 border c-br hc-s3"}`}
                  >
                    {isRegistered ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={13} /> Inscrito</span> : "Inscrever"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Arquivo */}
      {archived.length > 0 && (
        <div className="space-y-3 pt-2">
          <button onClick={() => setShowArchive(v => !v)} className="flex items-center gap-2 text-xs c-tx4 hover:c-tx transition-colors">
            <span className={`transition-transform ${showArchive ? "rotate-90" : ""}`}>▶</span>
            Arquivo ({archived.length} evento{archived.length !== 1 ? "s" : ""} passado{archived.length !== 1 ? "s" : ""})
          </button>
          <AnimatePresence>
            {showArchive && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                  {archived.map((item) => {
                    const isOnline = item.local === "Online";
                    const isRegistered = myInscriptions.includes(item.id);
                    return (
                      <div key={item.id} className="c-bg2 border c-br rounded-xl overflow-hidden flex flex-col">
                        <div className="h-1 w-full bg-white/10" />
                        <div className="p-5 flex flex-col gap-3 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/5 c-tx5">Concluído</span>
                          </div>
                          <p className="text-sm font-medium c-tx3 leading-snug line-through">{item.titulo}</p>
                          <div className="flex items-center gap-4 text-xs c-tx5">
                            <span className="flex items-center gap-1.5"><CalendarIcon size={12} />{new Date(item.data_evento).toLocaleDateString("pt-PT")}</span>
                            <span className="flex items-center gap-1.5">{isOnline ? <Laptop size={12} /> : <MapPin size={12} />}{item.local}</span>
                          </div>
                          {isRegistered && (
                            <span className="text-[10px] text-emerald-400/70 flex items-center gap-1"><CheckCircle2 size={11} /> Participei</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md c-bg border c-br rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b c-br">
              <h3 className="text-base font-semibold c-tx flex items-center gap-2"><CalendarIcon size={16} className="text-blue-400" /> Novo evento</h3>
              <button onClick={() => setIsModalOpen(false)} className="c-tx4 hc-tx"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Título</label>
                <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Sessão de Capacitação..." className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Formato</label>
                  <select value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value })} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none">
                    <option className="c-bg">Presencial</option>
                    <option className="c-bg">Online</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Data</label>
                  <input required type="date" value={form.data_evento} onChange={(e) => setForm({ ...form, data_evento: e.target.value })} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none [color-scheme:dark]" />
                </div>
              </div>
              {form.formato === "Presencial" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs c-tx3">Local</label>
                    <select value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none">
                      {["Luanda", "Bié"].map((l) => <option key={l} className="c-bg">{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs c-tx3">Morada (opcional)</label>
                    <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Ex: Rua da Missão, nº 12, Maianga" className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50" />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Imagem / cartaz (opcional)</label>
                <label className="flex items-center gap-2 border border-dashed c-br rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500/40 transition-colors">
                  <input type="file" accept="image/*" onChange={(e) => handleImagemSelect(e.target.files?.[0] ?? null)} className="sr-only" />
                  <ImagePlus size={14} className="c-tx5 shrink-0" />
                  <p className="text-sm c-tx3 truncate">{imagemFile ? imagemFile.name : "Seleccionar imagem"}</p>
                </label>
                {imagemPreview && <img src={imagemPreview} alt="Pré-visualização" className="w-full h-28 object-cover rounded-lg mt-1" />}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Âmbito</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none">
                  <option value="Global" className="c-bg">Global</option>
                  <option value="Restrito" className="c-bg">Restrito</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Acção de Formação associada (opcional)</label>
                <select value={form.acao_formacao_id} onChange={(e) => setForm({ ...form, acao_formacao_id: e.target.value })} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none">
                  <option value="" className="c-bg">Nenhuma — evento genérico</option>
                  {acoesFormacao.map((a: any) => <option key={a.id} value={a.id} className="c-bg">{a.designacao}</option>)}
                </select>
                <p className="text-[10px] c-tx5">Ao ligar, inscrever-se neste evento inscreve automaticamente na Acção de Formação.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border c-br text-sm c-tx3 hc-tx transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
