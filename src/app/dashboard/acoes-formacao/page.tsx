"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, X, UserPlus, GraduationCap, Calendar, MapPin, Users, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ESTADOS = ["agendada", "em_curso", "concluida", "cancelada"];
const ESTADO_LABEL: Record<string, string> = {
  agendada: "Agendada", em_curso: "Em curso", concluida: "Concluída", cancelada: "Cancelada",
};
const ESTADO_COLOR: Record<string, string> = {
  agendada: "border-blue-500/20 text-blue-400 bg-blue-500/10",
  em_curso: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  concluida: "border-slate-500/20 text-slate-400 bg-slate-500/10",
  cancelada: "border-red-500/20 text-red-400 bg-red-500/10",
};

type AcaoFormacao = {
  id: string;
  designacao: string;
  formacao_id: string | null;
  formacao_nome: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  horario: string | null;
  local: string | null;
  modalidade: string;
  vagas_max: number | null;
  estado: string;
  total_inscritos: number;
  formadores: { id: string; nome: string }[];
  imagem_url: string | null;
  area: string | null;
};

type Pessoa = { id: string; first_name: string; last_name: string; email: string };
type Material = { link_id: string; id: string; label: string; tamanho: string | null; area: string; disponivel_de: string | null; disponivel_ate: string | null };
type FicheiroRepo = { id: string; label: string; area: string };

function InitialAvatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`rounded-full flex items-center justify-center font-bold uppercase shrink-0 ${className}`}>
      {name?.[0] ?? "?"}
    </div>
  );
}

function fmtData(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default function AcoesFormacaoPage() {
  const { user } = useAdminUser();
  const [acoes, setAcoes] = useState<AcaoFormacao[]>([]);
  const [formadores, setFormadores] = useState<Pessoa[]>([]);
  const [formandos, setFormandos] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [inscritos, setInscritos] = useState<Record<string, Pessoa[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingInscrito, setAddingInscrito] = useState(false);
  const [selectedFormandos, setSelectedFormandos] = useState<string[]>([]);
  const [addingFormador, setAddingFormador] = useState(false);
  const [selectedNovoFormador, setSelectedNovoFormador] = useState<string>("");
  const [formandoSearch, setFormandoSearch] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    designacao: "", data_inicio: "", data_fim: "", horario: "", local: "",
    modalidade: "presencial", vagas_max: "", formador_ids: [] as string[], imagem_url: "", area: "",
  });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [disciplinas, setDisciplinas] = useState<{ id: string; nome: string }[]>([]);
  const [materiais, setMateriais] = useState<Record<string, Material[]>>({});
  const [meuRepositorio, setMeuRepositorio] = useState<FicheiroRepo[]>([]);
  const [publicando, setPublicando] = useState(false);
  const [novoMaterial, setNovoMaterial] = useState<Record<string, { arquivo_id: string; de: string; ate: string }>>({});

  function handleImagemSelect(file: File | null) {
    setImagemFile(file);
    setImagemPreview(file ? URL.createObjectURL(file) : null);
  }

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const isFormador = user?.role === "formador";

  async function fetchAll() {
    setLoading(true);
    try {
      const safe = (p: Promise<Response>) => p.then(r => r.ok ? r.json() : {}).catch(() => ({}));
      const [acoesRes, formadoresRes, formandosRes, disciplinasRes, repoRes] = await Promise.all([
        safe(fetch("/api/acoes-formacao")),
        safe(fetch("/api/db/profiles?eq.role=formador")),
        safe(fetch("/api/db/profiles?eq.role=formando")),
        safe(fetch("/api/admin/disciplinas")),
        safe(fetch(isAdmin ? "/api/db/arquivos" : `/api/db/arquivos?eq.uploader_id=${user?.id}`)),
      ]);
      setAcoes(acoesRes.data ?? []);
      setFormadores(formadoresRes.data ?? formadoresRes ?? []);
      setFormandos(formandosRes.data ?? formandosRes ?? []);
      setDisciplinas((disciplinasRes.disciplinas ?? []).filter((d: any) => d.activo));
      setMeuRepositorio(repoRes.data ?? []);
    } catch {
      // falha silenciosa
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) fetchAll(); }, [user]);

  async function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!inscritos[id]) {
      const res = await fetch(`/api/acoes-formacao/${id}/inscricoes`).then(r => r.json());
      setInscritos(prev => ({ ...prev, [id]: res.data ?? [] }));
    }
    if (!materiais[id]) {
      const res = await fetch(`/api/acoes-formacao/${id}/materiais`).then(r => r.json());
      setMateriais(prev => ({ ...prev, [id]: res.data ?? [] }));
    }
  }

  function getFicheirosDisponiveisParaPublicar(acao: AcaoFormacao) {
    const jaLigados = new Set((materiais[acao.id] ?? []).map(m => m.id));
    return meuRepositorio.filter(f => !jaLigados.has(f.id) && (!acao.area || f.area === acao.area));
  }

  async function handlePublicarMaterial(acaoId: string) {
    const draft = novoMaterial[acaoId];
    if (!draft?.arquivo_id) return;
    setPublicando(true);
    try {
      await fetch(`/api/acoes-formacao/${acaoId}/materiais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arquivo_id: draft.arquivo_id,
          disponivel_de: draft.de || null,
          disponivel_ate: draft.ate || null,
        }),
      });
      const res = await fetch(`/api/acoes-formacao/${acaoId}/materiais`).then(r => r.json());
      setMateriais(prev => ({ ...prev, [acaoId]: res.data ?? [] }));
      setNovoMaterial(prev => ({ ...prev, [acaoId]: { arquivo_id: "", de: "", ate: "" } }));
    } finally {
      setPublicando(false);
    }
  }

  async function handleDespublicarMaterial(acaoId: string, linkId: string) {
    if (!confirm("Remover este material desta acção?")) return;
    await fetch(`/api/acoes-formacao/${acaoId}/materiais?link_id=${linkId}`, { method: "DELETE" });
    setMateriais(prev => ({ ...prev, [acaoId]: (prev[acaoId] ?? []).filter(m => m.link_id !== linkId) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.designacao) return;
    setCreating(true);

    let imagem_url: string | undefined;
    if (imagemFile) {
      const sanitized = imagemFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `${Date.now()}_${sanitized}`;
      const uploadForm = new FormData();
      uploadForm.append("bucket", "eventos"); uploadForm.append("path", fileName); uploadForm.append("file", imagemFile);
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: uploadForm });
      if (uploadRes.ok) imagem_url = `/storage/v1/object/public/eventos/${fileName}`;
    }

    await fetch("/api/acoes-formacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        vagas_max: form.vagas_max ? Number(form.vagas_max) : null,
        formador_ids: isFormador ? [user?.id] : form.formador_ids,
        ...(imagem_url ? { imagem_url } : {}),
      }),
    });
    setShowCreate(false);
    setForm({ designacao: "", data_inicio: "", data_fim: "", horario: "", local: "", modalidade: "presencial", vagas_max: "", formador_ids: [], imagem_url: "", area: "" });
    handleImagemSelect(null);
    await fetchAll();
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar esta acção de formação?")) return;
    await fetch(`/api/acoes-formacao/${id}`, { method: "DELETE" });
    setAcoes(prev => prev.filter(a => a.id !== id));
    setExpanded(null);
  }

  async function handleEstadoChange(id: string, estado: string) {
    await fetch(`/api/acoes-formacao/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setAcoes(prev => prev.map(a => a.id === id ? { ...a, estado } : a));
  }

  async function handleAreaChange(id: string, area: string) {
    await fetch(`/api/acoes-formacao/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area: area || null }),
    });
    setAcoes(prev => prev.map(a => a.id === id ? { ...a, area: area || null } : a));
  }

  async function handleAddFormador(acaoId: string) {
    if (!selectedNovoFormador) return;
    setAddingFormador(true);
    await fetch(`/api/acoes-formacao/${acaoId}/formadores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formador_ids: [selectedNovoFormador] }),
    });
    setSelectedNovoFormador("");
    setAddingFormador(false);
    fetchAll();
  }

  async function handleRemoveFormador(acaoId: string, formadorId: string) {
    if (!confirm("Remover este formador como responsável desta acção?")) return;
    await fetch(`/api/acoes-formacao/${acaoId}/formadores?formador_id=${formadorId}`, { method: "DELETE" });
    fetchAll();
  }

  async function handleAddInscritos(acaoId: string) {
    if (selectedFormandos.length === 0) return;
    setAddingInscrito(true);
    for (const formandoId of selectedFormandos) {
      await fetch(`/api/acoes-formacao/${acaoId}/inscricoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formando_id: formandoId }),
      });
    }
    const res = await fetch(`/api/acoes-formacao/${acaoId}/inscricoes`).then(r => r.json());
    setInscritos(prev => ({ ...prev, [acaoId]: res.data ?? [] }));
    setSelectedFormandos([]);
    setAddingInscrito(false);
    fetchAll();
  }

  async function handleRemoveInscrito(acaoId: string, formandoId: string) {
    await fetch(`/api/acoes-formacao/${acaoId}/inscricoes?formando_id=${formandoId}`, { method: "DELETE" });
    setInscritos(prev => ({ ...prev, [acaoId]: (prev[acaoId] ?? []).filter(m => m.id !== formandoId) }));
    fetchAll();
  }

  const FORMANDOS_LIMITE_VISIVEL = 30;

  function getFormandosDisponiveis(acaoId: string) {
    const existentes = new Set((inscritos[acaoId] ?? []).map(m => m.id));
    const search = (formandoSearch[acaoId] ?? "").trim().toLowerCase();
    const base = formandos.filter(f => !existentes.has(f.id));
    const filtrados = search
      ? base.filter(f => `${f.first_name} ${f.last_name}`.toLowerCase().includes(search) || f.email?.toLowerCase().includes(search))
      : base;
    return { lista: filtrados.slice(0, FORMANDOS_LIMITE_VISIVEL), totalFiltrado: filtrados.length, totalGeral: base.length };
  }

  if (!isAdmin && !isFormador) return (
    <div className="flex items-center justify-center py-20 c-tx4 text-sm">Acesso restrito.</div>
  );

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold c-tx">Acções de Formação</h2>
          <p className="text-[11px] c-tx4 mt-0.5">{acoes.length} acção{acoes.length !== 1 ? "ões" : ""} de formação</p>
        </div>
        {(isAdmin || isFormador) && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-xs c-tx font-medium hover:bg-blue-500 transition-colors">
            <Plus size={13} /> Nova acção de formação
          </button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-2xl c-bg border c-br rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold c-tx">Nova acção de formação</h3>
              <button onClick={() => setShowCreate(false)}><X size={16} className="c-tx3" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Designação</label>
                <input required value={form.designacao} onChange={e => setForm(f => ({ ...f, designacao: e.target.value }))}
                  placeholder="Ex: Excel Avançado — 10 a 14 de Agosto"
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Área</label>
                  <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                    <option value="" className="c-bg">Sem área definida</option>
                    {disciplinas.map(d => <option key={d.id} value={d.nome} className="c-bg">{d.nome}</option>)}
                  </select>
                  <p className="text-[10px] c-tx5">Determina que ficheiros do Repositório ficam visíveis aos inscritos.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Horário</label>
                  <input value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                    placeholder="Ex: 14h00 — 17h00"
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Data início</label>
                  <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Data fim</label>
                  <input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Local / modalidade</label>
                  <input value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
                    placeholder="Ex: Luanda, Sala 3"
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Vagas (opcional)</label>
                  <input type="number" min="1" value={form.vagas_max} onChange={e => setForm(f => ({ ...f, vagas_max: e.target.value }))}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Imagem / cartaz (opcional)</label>
                  <label className="flex items-center gap-2 border border-dashed c-br rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500/40 transition-colors">
                    <input type="file" accept="image/*" onChange={e => handleImagemSelect(e.target.files?.[0] ?? null)} className="sr-only" />
                    <GraduationCap size={14} className="c-tx5 shrink-0" />
                    <p className="text-sm c-tx3 truncate">{imagemFile ? imagemFile.name : "Seleccionar imagem"}</p>
                  </label>
                  {imagemPreview && <img src={imagemPreview} alt="Pré-visualização" className="w-full h-20 object-cover rounded-lg mt-1" />}
                  <p className="text-[10px] c-tx5">Aparece também no evento da Agenda gerado automaticamente.</p>
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-xs c-tx3">Formador(es)</label>
                    <select multiple value={form.formador_ids}
                      onChange={e => setForm(f => ({ ...f, formador_ids: Array.from(e.target.selectedOptions, o => o.value) }))}
                      className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors h-[104px]">
                      {formadores.map(f => <option key={f.id} value={f.id} className="c-bg">{f.first_name} {f.last_name}</option>)}
                    </select>
                  </div>
                )}
              </div>
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

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-blue-500" /></div>
      ) : acoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 c-bg2 border c-br rounded-xl">
          <GraduationCap size={32} className="c-tx5" />
          <p className="text-sm c-tx3">Ainda não há acções de formação. Cria a primeira.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {acoes.map(acao => {
            const isOpen = expanded === acao.id;
            const { lista: disponiveis, totalFiltrado, totalGeral } = getFormandosDisponiveis(acao.id);
            const inscritosLista = inscritos[acao.id] ?? [];

            return (
              <motion.div key={acao.id} layout className="c-bg2 border c-br rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.015] transition-colors"
                  onClick={() => toggleExpand(acao.id)}>
                  {acao.imagem_url ? (
                    <img src={acao.imagem_url} alt={acao.designacao} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <GraduationCap size={18} className="text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold c-tx">{acao.designacao}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ESTADO_COLOR[acao.estado] ?? ESTADO_COLOR.agendada}`}>
                        {ESTADO_LABEL[acao.estado] ?? acao.estado}
                      </span>
                      {acao.area && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                          {acao.area}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] c-tx4 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {fmtData(acao.data_inicio)} — {fmtData(acao.data_fim)}</span>
                      {acao.local && <span className="flex items-center gap-1"><MapPin size={10} /> {acao.local}</span>}
                      <span className="flex items-center gap-1"><Users size={10} /> {acao.total_inscritos}{acao.vagas_max ? `/${acao.vagas_max}` : ""} inscritos</span>
                      {acao.formadores.length > 0 && <span>{acao.formadores.map(f => f.nome.trim()).join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    {isAdmin && (
                      <select value={acao.estado} onChange={e => handleEstadoChange(acao.id, e.target.value)}
                        className="c-s1 border c-br rounded-lg px-2 py-1.5 text-[11px] c-tx outline-none focus:border-blue-500/50">
                        {ESTADOS.map(e => <option key={e} value={e} className="c-bg">{ESTADO_LABEL[e]}</option>)}
                      </select>
                    )}
                    <button onClick={() => handleDelete(acao.id)}
                      className="p-1.5 rounded-lg c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => toggleExpand(acao.id)}>
                      {isOpen ? <ChevronUp size={14} className="c-tx4" /> : <ChevronDown size={14} className="c-tx4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t c-br px-5 py-4 space-y-4">
                        {isAdmin && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5">Área (repositório)</p>
                            <select value={acao.area ?? ""} onChange={e => handleAreaChange(acao.id, e.target.value)}
                              className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                              <option value="" className="c-bg">Sem área definida</option>
                              {disciplinas.map(d => <option key={d.id} value={d.nome} className="c-bg">{d.nome}</option>)}
                            </select>
                            <p className="text-[10px] c-tx5">Determina que ficheiros do Repositório desta área ficam visíveis aos inscritos.</p>
                          </div>
                        )}
                        {isAdmin && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5">Formador(es) responsável(eis)</p>
                            {acao.formadores.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {acao.formadores.map(f => (
                                  <div key={f.id}
                                    className="group flex items-center gap-2.5 px-3 py-2 rounded-lg c-s1 border c-br hover:border-red-500/20 transition-colors">
                                    <InitialAvatar name={f.nome} className="w-7 h-7 bg-amber-500/10 text-amber-400 text-[11px]" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-medium c-tx truncate">{f.nome.trim()}</p>
                                    </div>
                                    <button onClick={() => handleRemoveFormador(acao.id, f.id)}
                                      className="opacity-0 group-hover:opacity-100 c-tx5 hover:text-red-400 transition-all shrink-0">
                                      <X size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs c-tx5 italic">Ainda sem formador responsável associado.</p>
                            )}
                            {formadores.filter(f => !acao.formadores.some(af => af.id === f.id)).length > 0 && (
                              <div className="flex items-center gap-2">
                                <select value={selectedNovoFormador} onChange={e => setSelectedNovoFormador(e.target.value)}
                                  className="flex-1 c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none">
                                  <option value="" className="c-bg">Associar formador...</option>
                                  {formadores.filter(f => !acao.formadores.some(af => af.id === f.id)).map(f => (
                                    <option key={f.id} value={f.id} className="c-bg">{f.first_name} {f.last_name}</option>
                                  ))}
                                </select>
                                <button onClick={() => handleAddFormador(acao.id)} disabled={!selectedNovoFormador || addingFormador}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  {addingFormador ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />} Associar
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {inscritosLista.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5">
                              {inscritosLista.length} inscrito{inscritosLista.length !== 1 ? "s" : ""}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {inscritosLista.map(m => (
                                <div key={m.id}
                                  className="group flex items-center gap-2.5 px-3 py-2 rounded-lg c-s1 border c-br hover:border-red-500/20 transition-colors">
                                  <InitialAvatar name={m.first_name} className="w-7 h-7 bg-blue-500/10 text-blue-400 text-[11px]" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium c-tx truncate">{m.first_name} {m.last_name}</p>
                                  </div>
                                  <button onClick={() => handleRemoveInscrito(acao.id, m.id)}
                                    className="opacity-0 group-hover:opacity-100 c-tx5 hover:text-red-400 transition-all shrink-0">
                                    <X size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs c-tx5 italic">Ainda sem inscritos.</p>
                        )}

                        {totalGeral > 0 && (
                          <div className="space-y-2 pt-1 border-t c-br">
                            <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5 pt-3">Adicionar formandos</p>
                            <input type="text" value={formandoSearch[acao.id] ?? ""}
                              onChange={e => setFormandoSearch(prev => ({ ...prev, [acao.id]: e.target.value }))}
                              placeholder="Pesquisar por nome ou email..."
                              className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors" />
                            {disponiveis.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {disponiveis.map(f => (
                                  <label key={f.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                      selectedFormandos.includes(f.id) ? "border-blue-500/40 bg-blue-500/10" : "c-s1 c-br hc-s2"
                                    }`}>
                                    <input type="checkbox" checked={selectedFormandos.includes(f.id)}
                                      onChange={e => setSelectedFormandos(prev =>
                                        e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id)
                                      )}
                                      className="hidden" />
                                    <InitialAvatar name={f.first_name} className="w-6 h-6 c-s2 c-tx4 text-[10px]" />
                                    <span className="text-[11px] c-tx2 truncate">{f.first_name} {f.last_name}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs c-tx5 italic">Sem resultados para esta pesquisa.</p>
                            )}
                            {totalFiltrado > FORMANDOS_LIMITE_VISIVEL && (
                              <p className="text-[10px] c-tx5">A mostrar {FORMANDOS_LIMITE_VISIVEL} de {totalFiltrado} — refina a pesquisa para ver outros.</p>
                            )}
                            {selectedFormandos.length > 0 && (
                              <button onClick={() => handleAddInscritos(acao.id)} disabled={addingInscrito}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {addingInscrito ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                                Adicionar {selectedFormandos.length} formando{selectedFormandos.length !== 1 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        )}

                        {(() => {
                          const podeGerir = isAdmin || (acao.formadores ?? []).some(f => f.id === user?.id);
                          const ficheirosParaPublicar = getFicheirosDisponiveisParaPublicar(acao);
                          const draft = novoMaterial[acao.id] ?? { arquivo_id: "", de: "", ate: "" };
                          return (
                            <div className="space-y-2 pt-1 border-t c-br">
                              <p className="text-[10px] font-semibold uppercase tracking-wider c-tx5 pt-3">
                                Materiais {acao.area ? `— ${acao.area}` : ""}
                              </p>
                              {(materiais[acao.id] ?? []).length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {(materiais[acao.id] ?? []).map(m => (
                                    <div key={m.link_id}
                                      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg c-s1 border c-br hover:border-red-500/20 transition-colors">
                                      <FileText size={16} className="text-blue-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium c-tx truncate">{m.label}</p>
                                        <p className="text-[9px] c-tx5">
                                          {m.disponivel_de || m.disponivel_ate
                                            ? `${m.disponivel_de ? fmtData(m.disponivel_de) : "início"} — ${m.disponivel_ate ? fmtData(m.disponivel_ate) : "sem fim"}`
                                            : "Sempre disponível"}
                                        </p>
                                      </div>
                                      {podeGerir && (
                                        <button onClick={() => handleDespublicarMaterial(acao.id, m.link_id)}
                                          className="opacity-0 group-hover:opacity-100 c-tx5 hover:text-red-400 transition-all shrink-0">
                                          <X size={11} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs c-tx5 italic">Ainda sem materiais publicados nesta acção.</p>
                              )}
                              {podeGerir && (
                                ficheirosParaPublicar.length > 0 ? (
                                  <div className="space-y-2">
                                    <select value={draft.arquivo_id}
                                      onChange={e => setNovoMaterial(prev => ({ ...prev, [acao.id]: { ...draft, arquivo_id: e.target.value } }))}
                                      className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50">
                                      <option value="" className="c-bg">Escolher ficheiro do meu repositório...</option>
                                      {ficheirosParaPublicar.map(f => <option key={f.id} value={f.id} className="c-bg">{f.label} ({f.area})</option>)}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input type="date" value={draft.de}
                                        onChange={e => setNovoMaterial(prev => ({ ...prev, [acao.id]: { ...draft, de: e.target.value } }))}
                                        placeholder="Disponível de"
                                        className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 [color-scheme:dark]" />
                                      <input type="date" value={draft.ate}
                                        onChange={e => setNovoMaterial(prev => ({ ...prev, [acao.id]: { ...draft, ate: e.target.value } }))}
                                        placeholder="Disponível até"
                                        className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50 [color-scheme:dark]" />
                                    </div>
                                    <button onClick={() => handlePublicarMaterial(acao.id)} disabled={!draft.arquivo_id || publicando}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      {publicando ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Publicar nesta acção
                                    </button>
                                    <p className="text-[10px] c-tx5">Datas em branco = sempre disponível. Envia novos ficheiros no Repositório.</p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] c-tx5 italic">
                                    {acao.area ? `Não tens ficheiros de "${acao.area}" no Repositório para publicar aqui.` : "Define uma área para esta acção para poderes publicar materiais."}
                                  </p>
                                )
                              )}
                            </div>
                          );
                        })()}
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
