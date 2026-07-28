"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, UserCheck, ShieldCheck, Megaphone, ClipboardList } from "lucide-react";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  link: string | null;
  created_at: string;
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todas" | "nao-lidas">("todas");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notificacoes?limit=100");
      const json = await res.json();
      setNotifs(json.notificacoes ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  async function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
    await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  }

  async function clearAll() {
    if (!confirm("Eliminar todas as notificações? Esta acção não pode ser desfeita.")) return;
    setNotifs([]);
    await fetch("/api/notificacoes", { method: "DELETE" });
  }

  const unread = notifs.filter(n => !n.lida).length;
  const visible = filter === "nao-lidas" ? notifs.filter(n => !n.lida) : notifs;

  return (
    <div className="max-w-2xl mx-auto w-full py-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold c-tx">Notificações</h1>
          <p className="text-xs c-tx4 mt-0.5">{unread > 0 ? `${unread} por ler` : "Tudo em dia"}</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs c-tx3 hc-tx transition-colors">
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 text-xs c-tx5 hover:text-red-400 transition-colors">
              <Trash2 size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg c-s1 border c-br w-fit mb-4">
        {(["todas", "nao-lidas"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? "c-bg2 c-tx" : "c-tx4 hc-tx3"}`}
          >
            {f === "todas" ? "Todas" : "Não lidas"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border c-br overflow-hidden">
        {loading ? (
          <div className="py-14 text-center c-tx4 text-sm">A carregar...</div>
        ) : visible.length === 0 ? (
          <div className="py-14 text-center">
            <Bell size={28} className="mx-auto c-tx5 mb-2" />
            <p className="text-sm c-tx4">{filter === "nao-lidas" ? "Sem notificações por ler" : "Sem notificações"}</p>
          </div>
        ) : visible.map(n => {
          const isExpanded = expandedId === n.id;
          const iconBg = n.tipo === "novo_formando" ? "bg-emerald-500/10" : n.tipo === "novo_formador" ? "bg-amber-500/10" : n.tipo === "anuncio" ? "bg-purple-500/10" : "bg-blue-500/10";
          const icon = n.tipo === "novo_formando" ? <UserCheck size={16} className="text-emerald-400" /> : n.tipo === "novo_formador" ? <ShieldCheck size={16} className="text-amber-400" /> : n.tipo === "anuncio" ? <Megaphone size={16} className="text-purple-400" /> : n.tipo === "tarefa" ? <ClipboardList size={16} className="text-blue-400" /> : <Bell size={16} className="text-blue-400" />;
          const destino = n.link ?? (
            n.tipo === "novo_formando" || n.tipo === "novo_formador" ? "/dashboard/admin" :
            n.tipo === "tarefa" ? "/dashboard/tarefas" : null
          );
          return (
            <div
              key={n.id}
              onClick={() => {
                markRead(n.id);
                if (destino) { router.push(destino); return; }
                setExpandedId(isExpanded ? null : n.id);
              }}
              className={`w-full text-left px-5 py-4 border-b c-br last:border-b-0 hc-s2 transition-colors cursor-pointer ${!n.lida ? "bg-blue-500/5" : ""}`}
            >
              <div className="flex gap-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-tight ${!n.lida ? "c-tx" : "c-tx3"}`}>{n.titulo}</p>
                    <span className="text-xs c-tx5 shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.mensagem && (
                    <p className={`text-xs c-tx4 mt-1 leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-3"}`}>
                      {n.mensagem}
                    </p>
                  )}
                  {!n.lida && !isExpanded && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />}
                  {destino ? (
                    <span className="text-xs text-blue-400 mt-1.5 inline-block font-medium">Abrir →</span>
                  ) : n.mensagem && n.mensagem.length > 80 && (
                    <span className="text-xs text-blue-400/60 mt-1.5 inline-block">
                      {isExpanded ? "▲ Recolher" : "▼ Ver tudo"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
