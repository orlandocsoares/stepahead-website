"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Plus, X, Loader2, CheckCircle2, Clock,
  AlertCircle, ChevronDown, ChevronUp, Trash2, Users, User,
  CalendarClock, CheckCheck, RotateCcw, Paperclip, Upload,
  FileText, ExternalLink
} from "lucide-react";

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  prazo?: string;
  created_at: string;
  anexo_url?: string;
  anexo_nome?: string;
  // formando view
  criador_nome?: string;
  criador_apelido?: string;
  estado?: string;
  entregue_at?: string;
  resposta_url?: string;
  resposta_nome?: string;
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
  resposta_url?: string;
  resposta_nome?: string;
  nota?: string;
  feedback?: string;
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

function AnexoLink({ url, nome }: { url?: string; nome?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
      <FileText size={10} /> {nome ?? "Ficheiro anexo"} <ExternalLink size={9} />
    </a>
  );
}

async function uploadFicheiro(file: File, bucket: string, path: string): Promise<string> {
  const fd = new FormData();
  fd.append("bucket", bucket);
  fd.append("path", path);
  fd.append("upsert", "true");
  fd.append("file", file);
  const res = await fetch("/api/storage/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const j = await res.json();
    throw new Error(j.error?.message ?? "Erro no upload");
  }
  return `/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}`;
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

  // Upload de resposta por tarefa
  const [respostaFiles, setRespostaFiles] = useState<Record<string, File | null>>({});
  const respostaInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Modal avaliação
  const [avaliarModal, setAvaliarModal] = useState<{ tarefaId: string; formandoId: string; nome: string } | null>(null);
  const [avalNota, setAvalNota] = useState("");
  const [avalFeedback, setAvalFeedback] = useState("");
  const [avalSubmitting, setAvalSubmitting] = useState(false);

  async function submitAvaliacao() {
    if (!avaliarModal) return;
    setAvalSubmitting(true);
    await fetch(`/api/tarefas/${avaliarModal.tarefaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formando_id: avaliarModal.formandoId, estado: "avaliado", nota: avalNota || null, feedback: avalFeedback || null }),
    });
    setEntregas(prev => ({
      ...prev,
      [avaliarModal.tarefaId]: (prev[avaliarModal.tarefaId] ?? []).map(e =>
        e.id === avaliarModal.formandoId ? { ...e, estado: "avaliado", nota: avalNota || undefined, feedback: avalFeedback || undefined } : e
      ),
    }));
    setAvaliarModal(null);
    setAvalNota("");
    setAvalFeedback("");
    setAvalSubmitting(false);
  }

  // Modal criar tarefa
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", prazo: "" });
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const anexoInputRef = useRef<HTMLInputElement>(null);
  const [destMode, setDestMode] = useState<"meus" | "acao" | "individual" | "todos">("meus");
  const [destAcao, setDestAcao] = useState("");
  const [destIds, setDestIds] = useState<string[]>([]);
  const [formandoSearch, setFormandoSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acoesFormacao, setAcoesFormacao] = useState<{ id: string; designacao: string; total_inscritos: number }[]>([]);
  const [todosFormandos, setTodosFormandos] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

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
      fetch("/api/acoes-formacao").then(r => r.json()).then(j => setAcoesFormacao(j.data ?? []));
      fetch("/api/db/profiles?orderBy=first_name&ascending=true")
        .then(r => r.json())
        .then(j => setTodosFormandos((j.data ?? []).filter((u: any) => u.role === "formando")));
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
      let resposta_url: string | undefined;
      let resposta_nome: string | undefined;
      const file = respostaFiles[tarefaId];
      if (estado === "entregue" && file) {
        const safeName = `${tarefaId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        resposta_url = await uploadFicheiro(file, "tarefas", safeName);
        resposta_nome = file.name;
        setRespostaFiles(prev => ({ ...prev, [tarefaId]: null }));
      }
      await fetch(`/api/tarefas/${tarefaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, resposta_url, resposta_nome }),
      });
      setTarefas(prev => prev.map(t => t.id === tarefaId
        ? { ...t, estado, entregue_at: estado === "entregue" ? new Date().toISOString() : undefined, resposta_url, resposta_nome }
        : t));
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

  function openModal() {
    setForm({ titulo: "", descricao: "", prazo: "" });
    setAnexoFile(null);
    setDestMode("meus");
    setDestAcao(acoesFormacao[0]?.id ?? "");
    setDestIds([]);
    setFormandoSearch("");
    setError(null);
    setModalOpen(true);
  }

  function destinatariosPayload() {
    if (destMode === "individual") return destIds;
    if (destMode === "acao") return destAcao ? `acao:${destAcao}` : "meus";
    return destMode;
  }

  async function criarTarefa(e: React.FormEvent) {
    e.preventDefault();
    if (destMode === "individual" && destIds.length === 0) {
      setError("Selecciona pelo menos um formando.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let anexo_url: string | undefined;
      let anexo_nome: string | undefined;
      if (anexoFile) {
        const safeName = `anexo_${Date.now()}_${anexoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        anexo_url = await uploadFicheiro(anexoFile, "tarefas", safeName);
        anexo_nome = anexoFile.name;
      }
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prazo: form.prazo || null,
          destinatarios: destinatariosPayload(),
          anexo_url,
          anexo_nome,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar tarefa.");
      setModalOpen(false);
      fetchTarefas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Formando: kanban por estado pessoal
  const colFormando = useMemo(() => ({
    pendente:   tarefas.filter(t => t.estado === "pendente" || !t.estado),
    entregue:   tarefas.filter(t => t.estado === "entregue"),
    avaliado:   tarefas.filter(t => t.estado === "avaliado"),
  }), [tarefas]);

  // Formador: kanban por progresso de entrega
  // COUNT() vem como string do driver pg — forçar Number()
  const colFormador = useMemo(() => ({
    semEntregas: tarefas.filter(t => Number(t.entregues ?? 0) === 0),
    emProgresso: tarefas.filter(t => Number(t.entregues ?? 0) > 0 && Number(t.entregues ?? 0) < Number(t.total ?? 1)),
    completas:   tarefas.filter(t => Number(t.total ?? 0) > 0 && Number(t.entregues ?? 0) >= Number(t.total ?? 1)),
  }), [tarefas]);

  const COLS_FORMANDO = [
    { key: "pendente",  label: "A fazer",   color: "text-amber-400",   bar: "bg-amber-500",   empty: "Nenhuma tarefa por fazer." },
    { key: "entregue",  label: "Entregue",  color: "text-emerald-400", bar: "bg-emerald-500", empty: "Ainda não entregaste nada." },
    { key: "avaliado",  label: "Avaliado",  color: "text-blue-400",    bar: "bg-blue-500",    empty: "Nenhuma tarefa avaliada." },
  ] as const;

  const COLS_FORMADOR = [
    { key: "semEntregas", label: "Por entregar",  color: "text-amber-400",   bar: "bg-amber-500",   empty: "Nenhuma tarefa pendente." },
    { key: "emProgresso", label: "Em progresso",  color: "text-blue-400",    bar: "bg-blue-500",    empty: "Nenhuma em progresso." },
    { key: "completas",   label: "Concluídas",    color: "text-emerald-400", bar: "bg-emerald-500", empty: "Nenhuma concluída ainda." },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div id="tour-tarefas-header" className="flex items-center justify-between px-6 py-4 border-b c-br shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-blue-400" />
          <h1 className="text-sm font-semibold c-tx">Tarefas</h1>
          {!loading && <span className="text-xs c-tx4 ml-1">({tarefas.length})</span>}
        </div>
        {isStaff && (
          <button onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors">
            <Plus size={14} /> Nova tarefa
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : tarefas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <ClipboardList size={40} className="c-tx5" />
            <p className="text-sm c-tx4">{isStaff ? "Ainda não criaste nenhuma tarefa." : "Não tens tarefas atribuídas."}</p>
          </div>
        ) : (
          /* ── KANBAN ── */
          <div id="tour-tarefas-kanban" className="grid grid-cols-3 gap-3 h-full">

            {/* ── FORMANDO ── */}
            {!isStaff && COLS_FORMANDO.map(col => (
              <div key={col.key} className="flex flex-col c-bg2 border c-br rounded-xl overflow-hidden">
                <div className={`h-1 ${col.bar}`} />
                <div className="px-3 py-2.5 border-b c-br flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${col.color}`}>{col.label}</span>
                  <span className="ml-auto text-[10px] c-tx5">{colFormando[col.key].length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colFormando[col.key].length === 0 ? (
                    <p className="text-[11px] c-tx5 text-center py-6">{col.empty}</p>
                  ) : colFormando[col.key].map(t => (
                    <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="c-s1 border c-br rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium c-tx leading-snug">{t.titulo}</p>
                        <PrazoBadge prazo={t.prazo} />
                      </div>
                      {t.criador_nome && (
                        <p className="text-[10px] c-tx4 flex items-center gap-1"><User size={9} /> {t.criador_nome} {t.criador_apelido}</p>
                      )}
                      {t.descricao && <p className="text-[10px] c-tx4 line-clamp-2">{t.descricao}</p>}
                      {/* Anexo do formador */}
                      {t.anexo_url && <AnexoLink url={t.anexo_url} nome={t.anexo_nome} />}
                      {/* Upload resposta + acções */}
                      {col.key === "pendente" && (
                        <div className="space-y-1.5 pt-1">
                          {/* Input ficheiro oculto */}
                          <input type="file" className="hidden"
                            ref={el => { respostaInputRefs.current[t.id] = el; }}
                            onChange={e => setRespostaFiles(prev => ({ ...prev, [t.id]: e.target.files?.[0] ?? null }))} />
                          {respostaFiles[t.id] ? (
                            <div className="flex items-center gap-1.5 text-[10px] c-tx3 c-s2 border c-br rounded px-2 py-1">
                              <FileText size={10} className="shrink-0 text-blue-400" />
                              <span className="truncate flex-1">{respostaFiles[t.id]!.name}</span>
                              <button type="button" onClick={() => setRespostaFiles(prev => ({ ...prev, [t.id]: null }))}
                                className="c-tx5 hover:text-red-400 transition-colors"><X size={10} /></button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => respostaInputRefs.current[t.id]?.click()}
                              className="w-full py-1 rounded border border-dashed c-br c-tx5 text-[10px] hover:c-tx3 transition-colors flex items-center justify-center gap-1">
                              <Paperclip size={9} /> Anexar resposta (opcional)
                            </button>
                          )}
                          <button onClick={() => marcarEntregue(t.id, "entregue")} disabled={updatingId === t.id}
                            className="w-full py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                            {updatingId === t.id ? <Loader2 size={10} className="animate-spin" /> : <><CheckCircle2 size={10} /> Marcar como entregue</>}
                          </button>
                        </div>
                      )}
                      {col.key === "entregue" && (
                        <div className="space-y-1.5 pt-1">
                          {t.resposta_url && <AnexoLink url={t.resposta_url} nome={t.resposta_nome} />}
                          <button onClick={() => marcarEntregue(t.id, "pendente")} disabled={updatingId === t.id}
                            className="w-full py-1.5 rounded-lg c-s2 border c-br c-tx4 text-[10px] hover:c-tx3 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                            <RotateCcw size={10} /> Retirar entrega
                          </button>
                        </div>
                      )}
                      {col.key === "avaliado" && (
                        <div className="space-y-1">
                          {t.resposta_url && <AnexoLink url={t.resposta_url} nome={t.resposta_nome} />}
                          <span className="flex items-center gap-1 text-[10px] text-blue-400/70"><CheckCheck size={10} /> Avaliado</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── FORMADOR ── */}
            {isStaff && COLS_FORMADOR.map(col => (
              <div key={col.key} className="flex flex-col c-bg2 border c-br rounded-xl overflow-hidden">
                <div className={`h-1 ${col.bar}`} />
                <div className="px-3 py-2.5 border-b c-br flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${col.color}`}>{col.label}</span>
                  <span className="ml-auto text-[10px] c-tx5">{colFormador[col.key].length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colFormador[col.key].length === 0 ? (
                    <p className="text-[11px] c-tx5 text-center py-6">{col.empty}</p>
                  ) : colFormador[col.key].map(t => (
                    <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="c-s1 border c-br rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium c-tx leading-snug">{t.titulo}</p>
                        <button onClick={(e) => { e.stopPropagation(); eliminarTarefa(t.id); }}
                          className="p-1 rounded c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {t.criador_nome && (
                        <p className="text-[10px] c-tx4 flex items-center gap-1"><User size={9} /> {t.criador_nome} {t.criador_apelido}</p>
                      )}
                      {t.descricao && <p className="text-[10px] c-tx4 line-clamp-2">{t.descricao}</p>}
                      {t.anexo_url && <AnexoLink url={t.anexo_url} nome={t.anexo_nome} />}
                      <div className="flex items-center gap-2 flex-wrap">
                        <PrazoBadge prazo={t.prazo} />
                        <span className="text-[10px] c-tx4 flex items-center gap-1"><Users size={9} /> {Number(t.total ?? 0)}</span>
                        <span className="text-[10px] text-emerald-400/70 flex items-center gap-1"><CheckCheck size={9} /> {Number(t.entregues ?? 0)}</span>
                      </div>
                      {Number(t.total ?? 0) > 0 && (
                        <div className="h-1 w-full c-s2 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.round((Number(t.entregues ?? 0) / Number(t.total ?? 1)) * 100)}%` }} />
                        </div>
                      )}
                      <button onClick={() => toggleExpand(t.id)}
                        className="w-full text-[10px] c-tx4 hover:c-tx3 transition-colors flex items-center justify-center gap-1 pt-1">
                        {expandedId === t.id ? <><ChevronUp size={10} /> Recolher</> : <><ChevronDown size={10} /> Ver formandos</>}
                      </button>
                      <AnimatePresence>
                        {expandedId === t.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t c-br pt-2">
                            {loadingEntregas === t.id ? (
                              <div className="flex justify-center py-2"><Loader2 size={13} className="animate-spin c-tx4" /></div>
                            ) : (entregas[t.id] ?? []).length === 0 ? (
                              <p className="text-[10px] c-tx5 text-center py-1">Sem formandos.</p>
                            ) : (
                              <div className="space-y-2">
                                {(entregas[t.id] ?? []).map(e => (
                                  <div key={e.id} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full c-s2 flex items-center justify-center text-[9px] font-bold c-tx3 shrink-0">
                                        {e.first_name[0]?.toUpperCase()}
                                      </div>
                                      <span className="text-[10px] c-tx3 flex-1 truncate">{e.first_name} {e.last_name}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                                        e.estado === "avaliado" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                        e.estado === "entregue" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        "c-s1 c-tx5 c-br"}`}>
                                        {e.estado === "avaliado" ? "✓ avaliado" : e.estado === "entregue" ? "entregue" : "pendente"}
                                      </span>
                                      {e.estado === "entregue" && (
                                        <button
                                          onClick={() => { setAvaliarModal({ tarefaId: t.id, formandoId: e.id, nome: `${e.first_name} ${e.last_name}` }); setAvalNota(""); setAvalFeedback(""); }}
                                          className="text-[9px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors font-medium">
                                          Avaliar
                                        </button>
                                      )}
                                      {e.estado === "avaliado" && e.nota && (
                                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{e.nota}</span>
                                      )}
                                      {e.estado === "avaliado" && (
                                        <button onClick={() => marcarFormandoEstado(t.id, e.id, "entregue")}
                                          className="text-[9px] c-tx5 hover:c-tx4 transition-colors"><RotateCcw size={9} /></button>
                                      )}
                                    </div>
                                    {/* Resposta do formando */}
                                    {e.resposta_url && (
                                      <div className="ml-7">
                                        <AnexoLink url={e.resposta_url} nome={e.resposta_nome} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: criar tarefa */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative c-bg border c-br rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b c-br">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-blue-400" />
                <h3 className="text-sm font-semibold c-tx">Nova tarefa</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="c-tx4 hc-tx transition-colors"><X size={16} /></button>
            </div>

            <form onSubmit={criarTarefa} className="px-6 py-5 space-y-4">
              {/* Título + Prazo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Título *</label>
                  <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="ex: Resumo da aula de hoje"
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Prazo (opcional)</label>
                  <input type="datetime-local" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Descrição (opcional)</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={2} placeholder="Instruções detalhadas..."
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors resize-none" />
              </div>

              {/* Anexo */}
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Ficheiro de apoio (opcional)</label>
                <input type="file" className="hidden" ref={anexoInputRef}
                  onChange={e => setAnexoFile(e.target.files?.[0] ?? null)} />
                {anexoFile ? (
                  <div className="flex items-center gap-2 c-s1 border c-br rounded-lg px-3 py-2">
                    <FileText size={13} className="text-blue-400 shrink-0" />
                    <span className="text-xs c-tx2 flex-1 truncate">{anexoFile.name}</span>
                    <button type="button" onClick={() => setAnexoFile(null)} className="c-tx5 hover:text-red-400 transition-colors"><X size={13} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => anexoInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed c-br rounded-lg text-xs c-tx4 hover:c-tx3 hover:border-blue-500/30 transition-colors">
                    <Upload size={13} /> Carregar ficheiro
                  </button>
                )}
              </div>

              {/* Destinatários */}
              <div className="space-y-2">
                <label className="text-xs c-tx3">Destinatários</label>
                <div className={`grid gap-2 ${(user?.role === "admin" || user?.role === "super-admin") ? "grid-cols-4" : "grid-cols-3"}`}>
                  {[
                    { value: "meus",       label: "Meus formandos", icon: Users },
                    { value: "acao",       label: "Por Acção de Formação", icon: ChevronDown },
                    { value: "individual", label: "Individual",      icon: User },
                    ...((user?.role === "admin" || user?.role === "super-admin")
                      ? [{ value: "todos", label: "Todos", icon: Users }]
                      : []),
                  ].map(opt => {
                    const Icon = opt.icon;
                    const sel = destMode === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => setDestMode(opt.value as any)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all ${
                          sel ? "border-blue-500/50 bg-blue-500/10" : "c-br c-s1 hc-s2"
                        }`}>
                        <Icon size={14} className={sel ? "text-blue-400" : "c-tx4"} />
                        <span className={`text-[10px] font-medium ${sel ? "text-blue-300" : "c-tx3"}`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {destMode === "acao" && (
                  <select value={destAcao} onChange={e => setDestAcao(e.target.value)}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                    {acoesFormacao.length === 0
                      ? <option value="">Sem acções de formação criadas</option>
                      : acoesFormacao.map(a => <option key={a.id} value={a.id} className="c-bg">{a.designacao} ({a.total_inscritos} inscritos)</option>)
                    }
                  </select>
                )}

                {destMode === "individual" && (
                  <div className="space-y-2">
                    {destIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {destIds.map(id => {
                          const f = todosFormandos.find(u => u.id === id);
                          return f ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 text-[11px] border border-blue-500/30">
                              {f.first_name} {f.last_name}
                              <button type="button" onClick={() => setDestIds(prev => prev.filter(x => x !== id))} className="ml-0.5 hover:text-white">×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="relative">
                      <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
                      <input value={formandoSearch} onChange={e => setFormandoSearch(e.target.value)}
                        placeholder="Pesquisar formando..."
                        className="w-full pl-8 pr-3 py-2 c-s1 border c-br rounded-lg text-xs c-tx placeholder:c-tx5 outline-none focus:border-blue-500/40" />
                    </div>
                    <div className="max-h-32 overflow-y-auto c-s1 border c-br rounded-lg">
                      {todosFormandos
                        .filter(u => {
                          if (destIds.includes(u.id)) return false;
                          const name = `${u.first_name} ${u.last_name}`.toLowerCase();
                          return formandoSearch ? name.includes(formandoSearch.toLowerCase()) : true;
                        })
                        .slice(0, 15)
                        .map(u => (
                          <button key={u.id} type="button"
                            onClick={() => { setDestIds(prev => [...prev, u.id]); setFormandoSearch(""); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hc-s2 transition-colors border-b border-white/[0.03] last:border-0">
                            <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0">
                              {u.first_name[0]}
                            </div>
                            <span className="text-xs c-tx2">{u.first_name} {u.last_name}</span>
                          </button>
                        ))}
                      {todosFormandos.filter(u => !destIds.includes(u.id) && (formandoSearch ? `${u.first_name} ${u.last_name}`.toLowerCase().includes(formandoSearch.toLowerCase()) : true)).length === 0 && (
                        <p className="text-xs c-tx5 text-center py-3">Nenhum formando encontrado.</p>
                      )}
                    </div>
                  </div>
                )}
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

      {/* Modal de avaliação */}
      {avaliarModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAvaliarModal(null)} />
          <div className="relative c-bg border c-br rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b c-br">
              <div>
                <p className="text-xs c-tx3 font-medium uppercase tracking-widest">Avaliar entrega</p>
                <p className="text-sm font-semibold c-tx">{avaliarModal.nome}</p>
              </div>
              <button onClick={() => setAvaliarModal(null)} className="c-tx4 hc-tx"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Nota / Classificação (opcional)</label>
                <input
                  value={avalNota}
                  onChange={e => setAvalNota(e.target.value)}
                  placeholder="ex: 18/20, Bom, A+, ..."
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Comentário / Feedback (opcional)</label>
                <textarea
                  value={avalFeedback}
                  onChange={e => setAvalFeedback(e.target.value)}
                  rows={3}
                  placeholder="Observações sobre o trabalho entregue..."
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAvaliarModal(null)} className="flex-1 py-2 rounded-xl c-s2 border c-br c-tx3 text-sm hover:c-s3 transition-colors">
                  Cancelar
                </button>
                <button onClick={submitAvaliacao} disabled={avalSubmitting}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {avalSubmitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  {avalSubmitting ? "A guardar..." : "Confirmar avaliação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
