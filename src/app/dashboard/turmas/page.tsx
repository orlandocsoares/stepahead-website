"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Plus, Trash2, Users, ChevronDown, ChevronUp, Loader2, X, UserCheck, UserX, UserPlus, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AREAS = ["Geral", "Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];

const AREA_COLORS: Record<string, { bar: string; bg: string; text: string; badge: string }> = {
  "Matemática":        { bar: "bg-blue-500",    bg: "bg-blue-500/10",    text: "text-blue-400",    badge: "border-blue-500/20 text-blue-400 bg-blue-500/10" },
  "Língua Portuguesa": { bar: "bg-violet-500",  bg: "bg-violet-500/10",  text: "text-violet-400",  badge: "border-violet-500/20 text-violet-400 bg-violet-500/10" },
  "Física":            { bar: "bg-cyan-500",     bg: "bg-cyan-500/10",    text: "text-cyan-400",    badge: "border-cyan-500/20 text-cyan-400 bg-cyan-500/10" },
  "Química":           { bar: "bg-emerald-500",  bg: "bg-emerald-500/10", text: "text-emerald-400", badge: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" },
  "Pedagogia":         { bar: "bg-amber-500",    bg: "bg-amber-500/10",   text: "text-amber-400",   badge: "border-amber-500/20 text-amber-400 bg-amber-500/10" },
  "Geral":             { bar: "bg-slate-500",    bg: "bg-slate-500/10",   text: "text-slate-400",   badge: "border-slate-500/20 text-slate-400 bg-slate-500/10" },
};

function areaColor(area: string) {
  return AREA_COLORS[area] ?? AREA_COLORS["Geral"];
}

type Turma = {
  id: string;
  nome: string;
  area: string;
  formador_id: string;
  formador_nome: string;
  total_membros: number;
};

type Membro = { id: string; first_name: string; last_name: string; email: string };
type Formador = { id: string; first_name: string; last_name: string; email: string };
type Formando = { id: string; first_name: string; last_name: string; email: string };

function InitialAvatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`rounded-full flex items-center justify-center font-bold uppercase shrink-0 ${className}`}>
      {name?.[0] ?? "?"}
    </div>
  );
}

export default function TurmasPage() {
  const { user } = useAdminUser();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [formadores, setFormadores] = useState<Formador[]>([]);
  const [formandos, setFormandos] = useState<Formando[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [semTurma, setSemTurma] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignTurmaId, setAssignTurmaId] = useState<string>("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [membros, setMembros] = useState<Record<string, Membro[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingMembros, setAddingMembros] = useState(false);
  const [selectedFormandos, setSelectedFormandos] = useState<string[]>([]);
  const [form, setForm] = useState({ nome: "", area: "Matemática", formador_id: "" });

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const isFormador = user?.role === "formador";

  async function fetchAll() {
    setLoading(true);
    try {
      const safe = (p: Promise<Response>) => p.then(r => r.ok ? r.json() : {}).catch(() => ({}));
      const [turmasRes, formadoresRes, formandosRes, pendentesRes] = await Promise.all([
        safe(fetch("/api/turmas")),
        safe(fetch("/api/db/profiles?eq.role=formador")),
        safe(fetch("/api/db/profiles?eq.role=formando")),
        safe(fetch("/api/formandos-pendentes")),
      ]);
      setTurmas(turmasRes.data ?? []);
      setSemTurma(turmasRes.formandos_sem_turma ?? []);
      setFormadores(formadoresRes.data ?? formadoresRes ?? []);
      setFormandos(formandosRes.data ?? formandosRes ?? []);
      setPendentes(pendentesRes.formandos ?? []);
    } catch {
      // falha silenciosa
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) fetchAll(); }, [user]);

  async function handleAssignTurma(formandoId: string) {
    if (!assignTurmaId) return;
    setAssigningId(formandoId);
    await fetch(`/api/turmas/${assignTurmaId}/membros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formando_ids: [formandoId] }),
    });
    setSemTurma(prev => prev.filter(f => f.id !== formandoId));
    setAssigningId(null);
    fetchAll();
  }

  async function handleAprovar(formando_id: string, acao: "aprovar" | "rejeitar") {
    setApprovingId(formando_id);
    await fetch("/api/formandos-pendentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formando_id, acao }),
    });
    setPendentes(prev => prev.filter(f => f.id !== formando_id));
    setApprovingId(null);
    if (acao === "aprovar") fetchAll();
  }

  async function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!membros[id]) {
      const res = await fetch(`/api/turmas/${id}/membros`).then(r => r.json());
      setMembros(prev => ({ ...prev, [id]: res.data ?? [] }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const formadorId = isFormador ? (user?.id ?? "") : form.formador_id;
    if (!form.nome || !formadorId) return;
    setCreating(true);
    await fetch("/api/turmas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, formador_id: formadorId }),
    });
    setShowCreate(false);
    setForm({ nome: "", area: "Matemática", formador_id: "" });
    await fetchAll();
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar esta turma?")) return;
    await fetch(`/api/turmas?id=${id}`, { method: "DELETE" });
    setTurmas(prev => prev.filter(t => t.id !== id));
    setExpanded(null);
  }

  async function handleAddMembros(turmaId: string) {
    if (selectedFormandos.length === 0) return;
    setAddingMembros(true);
    await fetch(`/api/turmas/${turmaId}/membros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formando_ids: selectedFormandos }),
    });
    const res = await fetch(`/api/turmas/${turmaId}/membros`).then(r => r.json());
    setMembros(prev => ({ ...prev, [turmaId]: res.data ?? [] }));
    setSelectedFormandos([]);
    setAddingMembros(false);
    fetchAll();
  }

  async function handleRemoveMembro(turmaId: string, formandoId: string) {
    await fetch(`/api/turmas/${turmaId}/membros?formando_id=${formandoId}`, { method: "DELETE" });
    setMembros(prev => ({
      ...prev,
      [turmaId]: (prev[turmaId] ?? []).filter(m => m.id !== formandoId),
    }));
    fetchAll();
  }

  function getMembrosDisponiveis(turmaId: string) {
    const existentes = new Set((membros[turmaId] ?? []).map(m => m.id));
    return formandos.filter(f => !existentes.has(f.id));
  }

  if (!isAdmin && !isFormador) return (
    <div className="flex items-center justify-center py-20 c-tx4 text-sm">Acesso restrito.</div>
  );

  return (
    <div className="space-y-5 w-full">

      {/* Formandos pendentes */}
      {pendentes.length > 0 && (
        <div id="tour-pendentes" className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/10">
            <UserCheck size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {pendentes.length} aguarda{pendentes.length === 1 ? "" : "m"} aprovação
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {pendentes.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-center gap-3">
                  <InitialAvatar name={f.first_name} className="w-8 h-8 bg-amber-500/10 text-amber-400 text-xs" />
                  <div>
                    <p className="text-sm c-tx font-medium">{f.first_name} {f.last_name}</p>
                    <p className="text-[11px] c-tx4">{f.email}{f.escola ? ` · ${f.escola}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleAprovar(f.id, "aprovar")} disabled={approvingId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-40">
                    {approvingId === f.id ? <Loader2 size={11} className="animate-spin" /> : <UserCheck size={11} />} Aprovar
                  </button>
                  <button onClick={() => handleAprovar(f.id, "rejeitar")} disabled={approvingId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-40">
                    <UserX size={11} /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formandos sem turma */}
      {semTurma.length > 0 && (
        <div id="tour-sem-turma" className="bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-500/10">
            <UserPlus size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              {semTurma.length} sem turma atribuída
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {semTurma.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <InitialAvatar name={f.first_name} className="w-8 h-8 bg-blue-500/10 text-blue-400 text-xs" />
                  <div>
                    <p className="text-sm c-tx font-medium">{f.first_name} {f.last_name}</p>
                    <p className="text-[11px] c-tx4">{f.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={assignTurmaId} onChange={e => setAssignTurmaId(e.target.value)}
                    className="c-s1 border c-br rounded-lg px-3 py-1.5 text-xs c-tx outline-none focus:border-blue-500/50">
                    <option value="" className="c-bg">Escolher turma...</option>
                    {turmas.map(t => <option key={t.id} value={t.id} className="c-bg">{t.nome}</option>)}
                  </select>
                  <button onClick={() => handleAssignTurma(f.id)} disabled={!assignTurmaId || assigningId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition-colors disabled:opacity-40">
                    {assigningId === f.id ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />} Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div id="tour-turmas-header" className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold c-tx">Turmas</h2>
          <p className="text-[11px] c-tx4 mt-0.5">{turmas.length} turma{turmas.length !== 1 ? "s" : ""}</p>
        </div>
        {(isAdmin || isFormador) && (
          <button onClick={() => { setForm(f => ({ ...f, formador_id: isFormador ? (user?.id ?? "") : "" })); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-xs c-tx font-medium hover:bg-blue-500 transition-colors">
            <Plus size={13} /> Nova turma
          </button>
        )}
      </div>

      {/* Modal criar turma */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-sm c-bg border c-br rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold c-tx">Nova turma</h3>
              <button onClick={() => setShowCreate(false)}><X size={16} className="c-tx3" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Nome da turma</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Matemática 2026 — Turma A"
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Área</label>
                <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                  {AREAS.filter(a => a !== "Geral").map(a => <option key={a} value={a} className="c-bg">{a}</option>)}
                </select>
              </div>
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Formador</label>
                  <select required value={form.formador_id} onChange={e => setForm(f => ({ ...f, formador_id: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                    <option value="" className="c-bg">Seleccionar formador...</option>
                    {formadores.map(f => <option key={f.id} value={f.id} className="c-bg">{f.first_name} {f.last_name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors">Cancelar</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de turmas */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-blue-500" /></div>
      ) : turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 c-bg2 border c-br rounded-xl">
          <GraduationCap size={32} className="c-tx5" />
          <p className="text-sm c-tx3">Ainda não há turmas. Cria a primeira.</p>
        </div>
      ) : (
        <div id="tour-turmas-list" className="grid grid-cols-1 gap-3">
          {turmas.map(turma => {
            const isOpen = expanded === turma.id;
            const color = areaColor(turma.area);
            const disponíveis = getMembrosDisponiveis(turma.id);
            const membrosLista = membros[turma.id] ?? [];
            const visíveis = membrosLista.slice(0, 5);
            const extra = membrosLista.length - 5;

            return (
              <motion.div key={turma.id} layout className="c-bg2 border c-br rounded-xl overflow-hidden">
                {/* Barra de cor lateral usando border-l */}
                <div className={`h-0.5 w-full ${color.bar}`} />

                {/* Cabeçalho */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.015] transition-colors"
                  onClick={() => toggleExpand(turma.id)}>

                  {/* Ícone de área */}
                  <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
                    <GraduationCap size={18} className={color.text} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold c-tx">{turma.nome}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${color.badge}`}>
                        {turma.area}
                      </span>
                    </div>
                    <p className="text-[11px] c-tx4 mt-0.5">{turma.formador_nome?.trim()}</p>
                  </div>

                  {/* Avatares empilhados dos membros */}
                  {isOpen && membrosLista.length > 0 ? null : (
                    <div className="flex items-center shrink-0">
                      {turma.total_membros === 0 ? (
                        <span className="text-[11px] c-tx5 italic">Sem formandos</span>
                      ) : (
                        <div className="flex items-center">
                          {visíveis.map((m, i) => (
                            <div key={m.id}
                              style={{ zIndex: visíveis.length - i, marginLeft: i === 0 ? 0 : -8 }}
                              className="w-7 h-7 rounded-full c-s1 border-2 border-[color:var(--c-bg2)] flex items-center justify-center text-[9px] font-bold c-tx3 uppercase">
                              {m.first_name[0]}
                            </div>
                          ))}
                          {extra > 0 && (
                            <div style={{ marginLeft: -8, zIndex: 0 }}
                              className="w-7 h-7 rounded-full c-s2 border-2 border-[color:var(--c-bg2)] flex items-center justify-center text-[9px] font-semibold c-tx4">
                              +{extra}
                            </div>
                          )}
                          <span className="text-[11px] c-tx4 ml-2">
                            {turma.total_membros} formando{turma.total_membros !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acções */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button onClick={e => { e.stopPropagation(); handleDelete(turma.id); }}
                      className="p-1.5 rounded-lg c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                    {isOpen
                      ? <ChevronUp size={14} className="c-tx4" />
                      : <ChevronDown size={14} className="c-tx4" />}
                  </div>
                </div>

                {/* Expand: membros */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="border-t c-br px-5 py-4 space-y-4">

                        {/* Membros actuais em grelha de avatares */}
                        {membrosLista.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5">
                              {membrosLista.length} formando{membrosLista.length !== 1 ? "s" : ""}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              {membrosLista.map(m => (
                                <div key={m.id}
                                  className="group flex items-center gap-2.5 px-3 py-2 rounded-lg c-s1 border c-br hover:border-red-500/20 transition-colors">
                                  <div className={`w-7 h-7 rounded-full ${color.bg} flex items-center justify-center text-[11px] font-bold ${color.text} shrink-0`}>
                                    {m.first_name[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium c-tx truncate">{m.first_name} {m.last_name}</p>
                                  </div>
                                  <button onClick={() => handleRemoveMembro(turma.id, m.id)}
                                    className="opacity-0 group-hover:opacity-100 c-tx5 hover:text-red-400 transition-all shrink-0">
                                    <X size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs c-tx5 italic">Sem formandos nesta turma.</p>
                        )}

                        {/* Adicionar formandos */}
                        {disponíveis.length > 0 && (
                          <div className="space-y-2 pt-1 border-t c-br">
                            <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5 pt-3">Adicionar formandos</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                              {disponíveis.map(f => (
                                <label key={f.id}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    selectedFormandos.includes(f.id)
                                      ? `${color.badge} border-opacity-60`
                                      : "c-s1 c-br hc-s2"
                                  }`}>
                                  <input type="checkbox"
                                    checked={selectedFormandos.includes(f.id)}
                                    onChange={e => setSelectedFormandos(prev =>
                                      e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id)
                                    )}
                                    className="hidden" />
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    selectedFormandos.includes(f.id) ? `${color.bg} ${color.text}` : "c-s2 c-tx4"
                                  }`}>
                                    {f.first_name[0]?.toUpperCase()}
                                  </div>
                                  <span className="text-[11px] c-tx2 truncate">{f.first_name} {f.last_name}</span>
                                </label>
                              ))}
                            </div>
                            {selectedFormandos.length > 0 && (
                              <button onClick={() => handleAddMembros(turma.id)} disabled={addingMembros}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${color.bg} ${color.text} border ${color.badge.split(" ").find(c => c.startsWith("border-")) ?? "c-br"}`}>
                                {addingMembros ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                                Adicionar {selectedFormandos.length} formando{selectedFormandos.length !== 1 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
