"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  GraduationCap, Loader2, Calendar, MapPin, Laptop, User,
  ClipboardList, FileText, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";

type Acao = {
  id: string;
  designacao: string;
  data_inicio?: string;
  data_fim?: string;
  horario?: string;
  local?: string;
  modalidade?: string;
  estado?: string;
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
  const { user, loading: userLoading } = useAdminUser();
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
          <div className="space-y-3 max-w-3xl mx-auto">
            {acoes.map(a => {
              const nPendentes = pendentes(a.id);
              const nTarefas = tarefasDaAcao(a.id).length;
              const isExpanded = expandedId === a.id;
              const mats = materiais[a.id];
              return (
                <div key={a.id} className="c-bg2 border c-br rounded-xl overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold c-tx leading-snug">{a.designacao}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs c-tx4 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {formatPeriodo(a)}</span>
                          <span className="flex items-center gap-1">
                            {a.modalidade === "online" ? <Laptop size={11} /> : <MapPin size={11} />}
                            {a.local || (a.modalidade === "online" ? "Online" : "A definir")}
                          </span>
                        </div>
                        {a.formadores?.length > 0 && (
                          <p className="text-xs c-tx4 flex items-center gap-1 mt-1">
                            <User size={11} /> {a.formadores.map(f => f.nome).join(", ")}
                          </p>
                        )}
                      </div>
                      {a.estado && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-blue-500/10 text-blue-400 shrink-0">{a.estado}</span>
                      )}
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
