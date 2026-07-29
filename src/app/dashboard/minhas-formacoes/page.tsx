"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  GraduationCap, Loader2, Calendar, MapPin, Laptop, User, Users,
  ClipboardList, FileText, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  agendada: "Agendada", em_curso: "Em curso", concluida: "Concluída", cancelada: "Cancelada",
};
const ESTADO_COLOR: Record<string, string> = {
  agendada: "border-blue-500/20 text-blue-400 bg-blue-500/10",
  em_curso: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  concluida: "border-slate-500/20 text-slate-400 bg-slate-500/10",
  cancelada: "border-red-500/20 text-red-400 bg-red-500/10",
};

type Acao = {
  id: string;
  designacao: string;
  data_inicio?: string;
  data_fim?: string;
  horario?: string;
  local?: string;
  provincia?: string;
  modalidade?: string;
  estado?: string;
  area?: string;
  imagem_url?: string | null;
  total_inscritos?: number;
  vagas_max?: number | null;
  formadores: { id: string; nome: string }[];
};

type Tarefa = {
  id: string;
  titulo: string;
  acao_formacao_id?: string;
  estado?: string;
  total?: number;
  entregues?: number;
};

type Material = {
  id: string;
  link_id: string;
  label: string;
  tipo?: string;
  tamanho?: string;
};

function formatPeriodo(a: Acao) {
  if (!a.data_inicio) return "Sem data definida";
  const ini = new Date(a.data_inicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  if (!a.data_fim) return ini;
  const fim = new Date(a.data_fim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  return `${ini} — ${fim}`;
}

export default function MinhasFormacoesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}>
      <MinhasFormacoesPageInner />
    </Suspense>
  );
}

function MinhasFormacoesPageInner() {
  const { user, loading: userLoading } = useAdminUser();
  const searchParams = useSearchParams();
  const isFormando = user?.role === "formando";
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [materiais, setMateriais] = useState<Record<string, Material[] | undefined>>({});
  const [loadingMateriais, setLoadingMateriais] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, tRes] = await Promise.all([
          fetch("/api/acoes-formacao?minhas=1"),
          fetch("/api/tarefas"),
        ]);
        const aJson = await aRes.json();
        const tJson = await tRes.json();
        setAcoes(aJson.data ?? []);
        setTarefas(tJson.tarefas ?? []);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  // Deep-link vindo da Pesquisa Global (?acao=<id>) — leva até à acção e destaca-a
  useEffect(() => {
    const acaoId = searchParams.get("acao");
    if (!acaoId || acoes.length === 0) return;
    setTimeout(() => document.getElementById(`acao-${acaoId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, [searchParams, acoes]);

  async function toggleMateriais(acaoId: string) {
    if (expandedId === acaoId) { setExpandedId(null); return; }
    setExpandedId(acaoId);
    if (!materiais[acaoId]) {
      setLoadingMateriais(acaoId);
      try {
        const res = await fetch(`/api/acoes-formacao/${acaoId}/materiais`);
        const json = await res.json();
        setMateriais(prev => ({ ...prev, [acaoId]: json.data ?? [] }));
      } finally {
        setLoadingMateriais(null);
      }
    }
  }

  function tarefasDaAcao(acaoId: string) {
    return tarefas.filter(t => t.acao_formacao_id === acaoId);
  }

  function pendentes(acaoId: string) {
    const doAcao = tarefasDaAcao(acaoId);
    return isFormando
      ? doAcao.filter(t => t.estado === "pendente" || !t.estado).length
      : doAcao.filter(t => Number(t.total ?? 0) > Number(t.entregues ?? 0)).length;
  }

  if (userLoading || loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4 border-b c-br shrink-0">
        <GraduationCap size={18} className="text-blue-400" />
        <h1 className="text-sm font-semibold c-tx">As Minhas Formações</h1>
        {<span className="text-xs c-tx4 ml-1">({acoes.length})</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {acoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <GraduationCap size={40} className="c-tx5" />
            <p className="text-sm c-tx4">
              {isFormando ? "Ainda não estás inscrito em nenhuma acção de formação." : "Ainda não leccionas nenhuma acção de formação."}
            </p>
            <Link href="/dashboard/agenda" className="text-xs text-blue-400 hover:text-blue-300">Ver acções disponíveis na Agenda →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {acoes.map(a => {
              const nPendentes = pendentes(a.id);
              const nTarefas = tarefasDaAcao(a.id).length;
              const isExpanded = expandedId === a.id;
              const mats = materiais[a.id];
              const isHighlighted = searchParams.get("acao") === a.id;
              return (
                <div key={a.id} id={`acao-${a.id}`} className={`c-bg2 border rounded-xl overflow-hidden scroll-mt-4 transition-colors ${isHighlighted ? "border-blue-500/60 ring-1 ring-blue-500/40" : "c-br"}`}>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      {a.imagem_url ? (
                        <img src={a.imagem_url} alt={a.designacao} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <GraduationCap size={18} className="text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold c-tx leading-snug">{a.designacao}</p>
                          {a.estado && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ESTADO_COLOR[a.estado] ?? ESTADO_COLOR.agendada}`}>
                              {ESTADO_LABEL[a.estado] ?? a.estado}
                            </span>
                          )}
                          {a.area && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                              {a.area}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs c-tx4 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {formatPeriodo(a)}</span>
                          <span className="flex items-center gap-1">
                            {a.modalidade === "online" ? <Laptop size={11} /> : <MapPin size={11} />}
                            {[a.provincia, a.local].filter(Boolean).join(" — ") || (a.modalidade === "online" ? "Online" : "A definir")}
                          </span>
                          {typeof a.total_inscritos === "number" && (
                            <span className="flex items-center gap-1"><Users size={11} /> {a.total_inscritos}{a.vagas_max ? `/${a.vagas_max}` : ""} inscritos</span>
                          )}
                        </div>
                        {a.formadores?.length > 0 && (
                          <p className="text-xs c-tx4 flex items-center gap-1 mt-1">
                            <User size={11} /> {a.formadores.map(f => f.nome).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Link
                        href={`/dashboard/tarefas?acao=${a.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg c-s1 border c-br text-xs c-tx3 hover:c-tx2 hc-s2 transition-colors"
                      >
                        <ClipboardList size={12} className={nPendentes > 0 ? "text-amber-400" : "c-tx4"} />
                        {nTarefas === 0 ? "Sem tarefas" : `${nPendentes} de ${nTarefas} tarefa${nTarefas !== 1 ? "s" : ""} por ${isFormando ? "entregar" : "receber"}`}
                        <ExternalLink size={10} className="c-tx5" />
                      </Link>

                      <button
                        onClick={() => toggleMateriais(a.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg c-s1 border c-br text-xs c-tx3 hover:c-tx2 hc-s2 transition-colors"
                      >
                        <FileText size={12} className="c-tx4" /> Materiais
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t c-br pt-3 space-y-1.5">
                        {loadingMateriais === a.id ? (
                          <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin c-tx4" /></div>
                        ) : !mats || mats.length === 0 ? (
                          <p className="text-xs c-tx5 text-center py-2">Sem materiais publicados nesta acção.</p>
                        ) : (
                          mats.map(m => (
                            <div key={m.link_id} className="flex items-center gap-2 px-2 py-1.5 rounded c-s1 text-xs c-tx3">
                              <FileText size={12} className="text-blue-400 shrink-0" />
                              <span className="flex-1 truncate">{m.label}</span>
                              {m.tamanho && <span className="text-[10px] c-tx5 shrink-0">{m.tamanho}</span>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
