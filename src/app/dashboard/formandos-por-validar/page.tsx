"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { UserCheck, UserX, UserPlus, Loader2, Inbox } from "lucide-react";

type Pendente = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  escola: string | null;
  provincia: string | null;
  ff_status: "pendente" | "sem_associacao";
  formador_nome?: string | null;
  created_at: string;
};

function InitialAvatar({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shrink-0 bg-blue-500/15 text-blue-400">
      {name?.[0] ?? "?"}
    </div>
  );
}

export default function FormandosPorValidarPage() {
  const { user } = useAdminUser();
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  async function fetchPendentes() {
    setLoading(true);
    try {
      const res = await fetch("/api/formandos-pendentes").then(r => r.ok ? r.json() : { formandos: [] });
      setPendentes(res.formandos ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) fetchPendentes(); }, [user]);

  async function agir(formando_id: string, acao: "associar" | "aprovar" | "rejeitar") {
    setActingId(formando_id);
    try {
      const res = await fetch("/api/formandos-pendentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formando_id, acao }),
      });
      if (!res.ok) { alert("Não foi possível concluir a acção. Tenta novamente."); return; }
      setPendentes(prev => prev.filter(p => p.id !== formando_id));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-5">
      <div>
        <h1 className="text-xl font-bold c-tx">Formandos por Validar</h1>
        <p className="text-sm c-tx3 mt-1">
          Formandos que confirmaram o email e estão à espera de acesso. Qualquer formador pode aprovar.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 c-tx4">
          <Loader2 size={16} className="animate-spin" /> A carregar…
        </div>
      ) : pendentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 c-tx4">
          <Inbox size={32} strokeWidth={1} />
          <p className="text-sm">Sem formandos à espera de validação.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendentes.map((p) => {
            const nome = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email;
            const semAssociacao = p.ff_status === "sem_associacao";
            const acting = actingId === p.id;
            return (
              <div key={p.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                <InitialAvatar name={nome} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold c-tx truncate">{nome}</p>
                  <p className="text-xs c-tx4 truncate">
                    {p.email}{p.escola ? ` · ${p.escola}` : ""}{p.provincia ? ` · ${p.provincia}` : ""}
                  </p>
                  <p className="text-[10px] mt-0.5">
                    {semAssociacao ? (
                      <span className="text-amber-400">Ainda não escolheu nenhum formador</span>
                    ) : isAdmin && p.formador_nome ? (
                      <span className="c-tx4">Escolheu: {p.formador_nome}</span>
                    ) : (
                      <span className="c-tx4">Escolheu-te como formador</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {semAssociacao ? (
                    <button
                      onClick={() => agir(p.id, "associar")}
                      disabled={acting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                      {acting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Aprovar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => agir(p.id, "aprovar")}
                        disabled={acting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      >
                        {acting ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />} Aprovar
                      </button>
                      <button
                        onClick={() => agir(p.id, "rejeitar")}
                        disabled={acting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border c-br c-tx3 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <UserX size={13} /> Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
