"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Plus, Trash2, Users, ChevronDown, ChevronUp, Loader2, X, UserCheck, UserX, UserPlus } from "lucide-react";

const AREAS = ["Geral", "Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];

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
      // falha silenciosa — mostra lista vazia
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
    <div className="flex items-center justify-center py-20 text-white/30 text-sm">Acesso restrito.</div>
  );

  return (
    <div className="space-y-6 w-full">

      {/* Formandos pendentes de aprovação */}
      {pendentes.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/10">
            <UserCheck size={15} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">
              {pendentes.length} formando{pendentes.length !== 1 ? "s" : ""} aguarda{pendentes.length === 1 ? "" : "m"} aprovação
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {pendentes.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm text-white font-medium">{f.first_name} {f.last_name}</p>
                  <p className="text-xs text-white/40">{f.email}{f.escola ? ` · ${f.escola}` : ""}{f.provincia ? ` · ${f.provincia}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAprovar(f.id, "aprovar")}
                    disabled={approvingId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    {approvingId === f.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleAprovar(f.id, "rejeitar")}
                    disabled={approvingId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    <UserX size={12} /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formandos sem turma */}
      {semTurma.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-500/10">
            <UserPlus size={15} className="text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">
              {semTurma.length} formando{semTurma.length !== 1 ? "s" : ""} sem turma atribuída
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {semTurma.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
                <div>
                  <p className="text-sm text-white font-medium">{f.first_name} {f.last_name}</p>
                  <p className="text-xs text-white/40">{f.email}{f.provincia ? ` · ${f.provincia}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={assignTurmaId}
                    onChange={e => setAssignTurmaId(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
                  >
                    <option value="" className="bg-[#0d0d14]">Escolher turma...</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#0d0d14]">{t.nome}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssignTurma(f.id)}
                    disabled={!assignTurmaId || assigningId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    {assigningId === f.id ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white">Turmas</h2>
          <p className="text-sm text-white/40 mt-0.5">{turmas.length} turma{turmas.length !== 1 ? "s" : ""}</p>
        </div>
        {(isAdmin || isFormador) && (
        <button onClick={() => { setForm(f => ({ ...f, formador_id: isFormador ? (user?.id ?? "") : "" })); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">
          <Plus size={14} /> Nova turma
        </button>
        )}
      </div>

      {/* Modal criar turma */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-sm bg-[#0d0d14] border border-white/[0.08] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Nova turma</h3>
              <button onClick={() => setShowCreate(false)}><X size={16} className="text-white/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Nome da turma</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Matemática 2026 — Turma A"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Área</label>
                <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50">
                  {AREAS.filter(a => a !== "Geral").map(a => <option key={a} value={a} className="bg-[#0d0d14]">{a}</option>)}
                </select>
              </div>
              {isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Formador</label>
                <select required value={form.formador_id} onChange={e => setForm(f => ({ ...f, formador_id: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50">
                  <option value="" className="bg-[#0d0d14]">Seleccionar formador...</option>
                  {formadores.map(f => (
                    <option key={f.id} value={f.id} className="bg-[#0d0d14]">{f.first_name} {f.last_name}</option>
                  ))}
                </select>
              </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 size={13} className="animate-spin" /> : null} Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-blue-500" /></div>
      ) : turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-[#13131f] border border-white/[0.06] rounded-xl">
          <Users size={28} className="text-white/20" />
          <p className="text-sm text-white/40">Ainda não há turmas. Cria a primeira.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map(turma => {
            const isOpen = expanded === turma.id;
            const disponíveis = getMembrosDisponiveis(turma.id);
            return (
              <div key={turma.id} className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Cabeçalho da turma */}
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(turma.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{turma.nome}</p>
                      <p className="text-[11px] text-white/40">{turma.area} · {turma.formador_nome?.trim()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-white/30">{turma.total_membros} formando{turma.total_membros !== 1 ? "s" : ""}</span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(turma.id); }}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                    {isOpen ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                  </div>
                </div>

                {/* Membros expandidos */}
                {isOpen && (
                  <div className="border-t border-white/[0.06] px-5 py-4 space-y-4">
                    {/* Membros actuais */}
                    {(membros[turma.id] ?? []).length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Formandos</p>
                        <div className="space-y-1">
                          {(membros[turma.id] ?? []).map(m => (
                            <div key={m.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] group">
                              <span className="text-sm text-white/70">{m.first_name} {m.last_name}</span>
                              <button onClick={() => handleRemoveMembro(turma.id, m.id)}
                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all">
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/30 italic">Sem formandos nesta turma.</p>
                    )}

                    {/* Adicionar formandos */}
                    {disponíveis.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] uppercase tracking-wider text-white/30">Adicionar formandos</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {disponíveis.map(f => (
                            <label key={f.id} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg hover:bg-white/[0.03] cursor-pointer">
                              <input type="checkbox"
                                checked={selectedFormandos.includes(f.id)}
                                onChange={e => setSelectedFormandos(prev =>
                                  e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id)
                                )}
                                className="accent-blue-500"
                              />
                              <span className="text-sm text-white/60">{f.first_name} {f.last_name}</span>
                              <span className="text-[10px] text-white/25 ml-auto">{f.email}</span>
                            </label>
                          ))}
                        </div>
                        {selectedFormandos.length > 0 && (
                          <button onClick={() => handleAddMembros(turma.id)} disabled={addingMembros}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/80 text-xs text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
                            {addingMembros ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Adicionar {selectedFormandos.length} formando{selectedFormandos.length !== 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
