"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, UserCheck, ShieldCheck, Megaphone, ClipboardList, FileText, MessageSquare, Inbox } from "lucide-react";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  link: string | null;
  created_at: string;
};

const TIPO_STYLE: Record<string, { icon: any; text: string; bg: string; border: string; dot: string }> = {
  novo_formando: { icon: UserCheck,     text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-l-emerald-500", dot: "bg-emerald-400" },
  novo_formador: { icon: ShieldCheck,   text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-l-amber-500",   dot: "bg-amber-400" },
  anuncio:       { icon: Megaphone,     text: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-l-purple-500",  dot: "bg-purple-400" },
  tarefa:        { icon: ClipboardList, text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-l-blue-500",    dot: "bg-blue-400" },
  documento:     { icon: FileText,      text: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-l-teal-500",    dot: "bg-teal-400" },
  mensagem:      { icon: MessageSquare, text: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-l-pink-500",    dot: "bg-pink-400" },
};
const DEFAULT_STYLE = { icon: Bell, text: "text-blue-400", bg: "bg-blue-500/10", border: "border-l-blue-500", dot: "bg-blue-400" };

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function groupLabel(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays <= 7) return "Esta semana";
  return "Anteriores";
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

  const groups = useMemo(() => {
    const order = ["Hoje", "Ontem", "Esta semana", "Anteriores"];
    const map = new Map<string, Notificacao[]>();
    for (const n of visible) {
      const g = groupLabel(n.created_at);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    }
    return order.filter(g => map.has(g)).map(g => ({ label: g, items: map.get(g)! }));
  }, [visible]);

  return (
    <div className="max-w-2xl mx-auto w-full py-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 border c-br flex items-center justify-center shrink-0">
            <Bell size={19} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold c-tx leading-tight">Notificações</h1>
            <p className="text-xs c-tx4 mt-0.5">
              {unread > 0 ? <><span className="font-semibold text-blue-400">{unread}</span> por ler</> : "Tudo em dia ✓"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs c-tx3 hc-tx transition-colors">
              <CheckCheck size={14} /> Marcar lidas
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 text-xs c-tx5 hover:text-red-400 transition-colors">
              <Trash2 size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-1 p-1 rounded-lg c-s1 border c-br w-fit mb-5">
        {(["todas", "nao-lidas"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? "c-bg2 c-tx shadow-sm" : "c-tx4 hc-tx3"}`}
          >
            {f === "todas" ? "Todas" : "Não lidas"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-16 text-center c-tx4 text-sm">A carregar...</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 c-bg2 border c-br rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Inbox size={24} className="text-blue-400/70" />
          </div>
          <p className="text-sm c-tx4">{filter === "nao-lidas" ? "Sem notificações por ler" : "Sem notificações"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest c-tx5 mb-2 px-1">{group.label}</p>
              <div className="space-y-2">
                {group.items.map(n => {
                  const isExpanded = expandedId === n.id;
                  const style = TIPO_STYLE[n.tipo] ?? DEFAULT_STYLE;
                  const Icon = style.icon;
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
                      className={`relative flex gap-3.5 px-4 py-3.5 rounded-xl border border-l-4 c-br ${style.border} c-bg2 hover:shadow-md hc-s2 transition-all cursor-pointer ${!n.lida ? "shadow-sm" : "opacity-80"}`}
                    >
                      {!n.lida && <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${style.dot}`} />}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                        <Icon size={16} className={style.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight pr-3 ${!n.lida ? "font-semibold c-tx" : "font-medium c-tx3"}`}>{n.titulo}</p>
                          <span className="text-[10px] c-tx5 shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                        </div>
                        {n.mensagem && (
                          <p className={`text-xs c-tx4 mt-1 leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-2"}`}>
                            {n.mensagem}
                          </p>
                        )}
                        {destino ? (
                          <span className={`text-xs mt-1.5 inline-block font-semibold ${style.text}`}>Abrir →</span>
                        ) : n.mensagem && n.mensagem.length > 80 && (
                          <span className="text-xs text-blue-400/60 mt-1.5 inline-block">
                            {isExpanded ? "▲ Recolher" : "▼ Ver tudo"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
