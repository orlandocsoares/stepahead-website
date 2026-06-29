"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Plus, X, Loader2, CheckCircle2, Clock,
  AlertCircle, ChevronDown, ChevronUp, Trash2, Users, User,
  CalendarClock, CheckCheck, RotateCcw
} from "lucide-react";

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  prazo?: string;
  created_at: string;
  // formando view
  criador_nome?: string;
  criador_apelido?: string;
  estado?: string;
  entregue_at?: string;
  // formador view
  total?: number;
  entregues?: number;
};

type Entrega = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  estado: string;
  entregue_at?: string;
};

function prazoStatus(prazo?: string): "expirado" | "urgente" | "ok" | null {
  if (!prazo) return null;
  const diff = new Date(prazo).getTime() - Date.now();
  if (diff < 0) return "expirado";
  if (diff < 48 * 3600 * 1000) return "urgente";
  return "ok";
}

function PrazoBadge({ prazo }: { prazo?: string }) {
  const status = prazoStatus(prazo);
  if (!prazo || !status) return null;
  const date = new Date(prazo).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  const cls =
    status === "expirado" ? "bg-red-500/10 text-red-400 border-red-500/20" :
    status === "urgente"  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "c-s1 c-tx3 c-br";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      <CalendarClock size={10} /> {date}
    </span>
  );
}

export default function TarefasPage() {
  const { user } = useAdminUser();
  const isStaff = user?.role === "formador" || user?.role === "admin" || user?.role === "super-admin";

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entregas, setEntregas] = useState<Record<string, Entrega[]>>({});
  const [loadingEntregas, setLoadingEntregas] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal criar tarefa
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", prazo: "", destinatarios: "meus" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<{ id: string; nome: string; total: number }[]>([]);

  async function fetchTarefas() {
    setLoading(true);
    try {
      const res = await fetch("/api/tarefas");
      const json = await res.json();
      setTarefas(json.tarefas ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTarefas();
    if (isStaff) {
      fetch("/api/turmas").then(r => r.json()).then(j => setTurmas(j.data ?? []));
    }
  }, [isStaff]);

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (isStaff && !entregas[id]) {
      setLoadingEntregas(id);
      try {
        const res = await fetch(`/api/tarefas/${id}`);
        const json = await res.json();
        setEntregas(prev => ({ ...prev, [id]: json.entregas ?? [] }));
      } finally {
        setLoadingEntregas(null);
      }
    }
  }

  async function marcarEntregue(tarefaId: string, estado: string) {
    setUpdatingId(tarefaId);
    try {
      await fetch(`/api/tarefas/${tarefaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      setTarefas(prev => prev.map(t => t.id === tarefaId ? { ...t, estado, entregue_at: estado === "entregue" ? new Date().toISOString() : undefined } : t));
    } finally {
      setUpdatingId(null);
    }
  }

  async function marcarFormandoEstado(tarefaId: string, formandoId: string, estado: string) {
    await fetch(`/api/tarefas/${tarefaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formando_id: formandoId, estado }),
    });
    setEntregas(prev => ({
      ...prev,
      [tarefaId]: (prev[tarefaId] ?? []).map(e => e.id === formandoId ? { ...e, estado } : e),
    }));
  }

  async function eliminarTarefa(id: string) {
    if (!confirm("Eliminar esta tarefa?")) return;
    await fetch(`/api/tarefas/${id}`, { method: "DELETE" });
    setTarefas(prev => prev.filter(t => t.id !== id));
  }

  async function criarTarefa(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, prazo: form.prazo || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar tarefa.");
      setModalOpen(false);
      setForm({ titulo: "", descricao: "", prazo: "", destinatarios: "meus" });
      fetchTarefas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const pendentes = useMemo(() => tarefas.filter(t => t.estado === "pendente" || (!t.estado && isStaff)), [tarefas, isStaff]);
  const entregues = useMemo(() => tarefas.filter(t => t.estado && t.estado !== "pendente"), [tarefas]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b c-br shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-blue-400" />
          <h1 className="text-sm font-semibold c-tx">Tarefas</h1>
          {!loading && <span className="text-xs c-tx4 ml-1">({tarefas.length})</span>}
        </div>
        {isStaff && (
          <button onClick={() => { setModalOpen(true); setError(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors">
            <Plus size={14} /> Nova tarefa
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-native-scroll px-6 py-5 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : tarefas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <ClipboardList size={40} className="c-tx5" />
            <p className="text-sm c-tx4">
              {isStaff ? "Ainda não criaste nenhuma tarefa." : "Não tens tarefas atribuídas."}
            </p>
          </div>
        ) : (
          <>
            {/* Formando: pendentes / entregues */}
            {!isStaff && (
              <>
                {pendentes.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest c-tx4">Pendentes</p>
                    {pendentes.map(t => (
                      <TarefaCard key={t.id} tarefa={t} expanded={expandedId === t.id}
                        onToggle={() => toggleExpand(t.id)}
                        onMarcar={(estado) => marcarEntregue(t.id, estado)}
                        updating={updatingId === t.id}
                        isStaff={false} />
                    ))}
                  </section>
                )}
                {entregues.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest c-tx4">Entregues / Avaliadas</p>
                    {entregues.map(t => (
                      <TarefaCard key={t.id} tarefa={t} expanded={expandedId === t.id}
                        onToggle={() => toggleExpand(t.id)}
                        onMarcar={(estado) => marcarEntregue(t.id, estado)}
                        updating={updatingId === t.id}
                        isStaff={false} />
                    ))}
                  </section>
                )}
              </>
            )}

            {/* Formador: todas as tarefas criadas */}
            {isStaff && (
              <section className="space-y-2">
                {tarefas.map(t => (
                  <div key={t.id} className="c-s1 border c-br rounded-xl overflow-hidden">
                    <button onClick={() => toggleExpand(t.id)}
                      className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium c-tx">{t.titulo}</span>
                          <PrazoBadge prazo={t.prazo} />
                        </div>
                        {t.descricao && <p className="text-xs c-tx3 line-clamp-1">{t.descricao}</p>}
                        <div className="flex items-center gap-3 text-[11px] c-tx4">
                          <span className="flex items-center gap-1"><Users size={10} /> {t.total ?? 0} formandos</span>
                          <span className="flex items-center gap-1 text-emerald-400/70"><CheckCheck size={10} /> {t.entregues ?? 0} entregues</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); eliminarTarefa(t.id); }}
                          className="p-1.5 rounded-lg c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                        {expandedId === t.id ? <ChevronUp size={15} className="c-tx4" /> : <ChevronDown size={15} className="c-tx4" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedId === t.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="border-t c-br overflow-hidden">
                          <div className="px-4 py-3">
                            {t.descricao && <p className="text-xs c-tx3 mb-3">{t.descricao}</p>}
                            {loadingEntregas === t.id ? (
                              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin c-tx4" /></div>
                            ) : (entregas[t.id] ?? []).length === 0 ? (
                              <p className="text-xs c-tx4 py-2 text-center">Sem formandos atribuídos.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {(entregas[t.id] ?? []).map(e => (
                                  <div key={e.id} className="flex items-center gap-3 py-1.5">
                                    <div className="w-6 h-6 rounded-full c-s2 flex items-center justify-center text-[10px] font-bold c-tx3 shrink-0">
                                      {e.first_name[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-xs c-tx2 flex-1">{e.first_name} {e.last_name}</span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                      e.estado === "avaliado"  ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                      e.estado === "entregue"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                      "c-s1 c-tx4 c-br"
                                    }`}>
                                      {e.estado === "avaliado" ? "avaliado" : e.estado === "entregue" ? "entregue" : "pendente"}
                                    </span>
                                    {e.estado === "entregue" && (
                                      <button onClick={() => marcarFormandoEstado(t.id, e.id, "avaliado")}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                        Avaliar
                                      </button>
                                    )}
                                    {e.estado === "avaliado" && (
                                      <button onClick={() => marcarFormandoEstado(t.id, e.id, "entregue")}
                                        className="text-[10px] c-tx4 hover:c-tx3 transition-colors">
                                        <RotateCcw size={11} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {/* MODAL: criar tarefa */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative c-bg border c-br rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b c-br">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-blue-400" />
                <h3 className="text-sm font-semibold c-tx">Nova tarefa</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="c-tx4 hc-tx transition-colors"><X size={16} /></button>
            </div>

            <form onSubmit={criarTarefa} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Título *</label>
                <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="ex: Resumo da aula de hoje"
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Descrição (opcional)</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3} placeholder="Instruções detalhadas..."
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Prazo (opcional)</label>
                  <input type="datetime-local" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Destinatários</label>
                  <select value={form.destinatarios} onChange={e => setForm(f => ({ ...f, destinatarios: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                    <option value="meus">Os meus formandos</option>
                    {turmas.length > 0 && (
                      <optgroup label="Por turma">
                        {turmas.map(t => (
                          <option key={t.id} value={`turma:${t.id}`}>{t.nome} ({t.total})</option>
                        ))}
                      </optgroup>
                    )}
                    {(user?.role === "admin" || user?.role === "super-admin") && (
                      <option value="todos">Todos os formandos</option>
                    )}
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={13} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {submitting ? "A criar..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TarefaCard({ tarefa, expanded, onToggle, onMarcar, updating, isStaff }: {
  tarefa: Tarefa;
  expanded: boolean;
  onToggle: () => void;
  onMarcar: (estado: string) => void;
  updating: boolean;
  isStaff: boolean;
}) {
  const entregue = tarefa.estado === "entregue" || tarefa.estado === "avaliado";
  const avaliado = tarefa.estado === "avaliado";

  return (
    <div className={`c-s1 border rounded-xl overflow-hidden transition-colors ${
      avaliado ? "border-blue-500/20" : entregue ? "border-emerald-500/20" : "c-br"
    }`}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          avaliado ? "bg-blue-500 border-blue-500" : entregue ? "bg-emerald-500 border-emerald-500" : "c-br2"
        }`}>
          {(entregue || avaliado) && <CheckCircle2 size={12} className="c-tx" />}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${entregue ? "c-tx3 line-through" : "c-tx"}`}>{tarefa.titulo}</span>
            <PrazoBadge prazo={tarefa.prazo} />
            {avaliado && <span className="text-[10px] text-blue-400 font-medium">avaliado</span>}
          </div>
          {tarefa.criador_nome && (
            <p className="text-[11px] c-tx4">{tarefa.criador_nome} {tarefa.criador_apelido}</p>
          )}
        </div>
        {expanded ? <ChevronUp size={14} className="c-tx4 shrink-0 mt-1" /> : <ChevronDown size={14} className="c-tx4 shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="border-t c-br overflow-hidden">
            <div className="px-4 py-3 space-y-3">
              {tarefa.descricao && <p className="text-xs c-tx3">{tarefa.descricao}</p>}
              {tarefa.prazo && (
                <p className="text-[11px] c-tx4 flex items-center gap-1">
                  <Clock size={10} /> Prazo: {new Date(tarefa.prazo).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {tarefa.entregue_at && (
                <p className="text-[11px] text-emerald-400/70 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Entregue a {new Date(tarefa.entregue_at).toLocaleDateString("pt-PT")}
                </p>
              )}
              {!isStaff && (
                <div className="flex gap-2 pt-1">
                  {!entregue ? (
                    <button disabled={updating} onClick={() => onMarcar("entregue")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                      {updating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Marcar como entregue
                    </button>
                  ) : !avaliado ? (
                    <button disabled={updating} onClick={() => onMarcar("pendente")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg c-s1 c-tx3 text-xs border c-br hc-s3 transition-colors disabled:opacity-50">
                      {updating ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                      Cancelar entrega
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
