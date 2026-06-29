"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Shield, Filter } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  actor_id?: string;
  actor_nome?: string;
  actor_apelido?: string;
  actor_role?: string;
  target_nome?: string;
  target_apelido?: string;
  ip?: string;
  details?: Record<string, any>;
  created_at: string;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login_success:        { label: "Login",              color: "text-emerald-400 bg-emerald-400/10" },
  login_fail:           { label: "Login falhado",      color: "text-red-400 bg-red-400/10" },
  logout:               { label: "Logout",             color: "text-slate-400 bg-slate-400/10" },
  register:             { label: "Registo",            color: "text-blue-400 bg-blue-400/10" },
  password_change:      { label: "Password alterada",  color: "text-amber-400 bg-amber-400/10" },
  password_reset_request: { label: "Reset password",  color: "text-amber-400 bg-amber-400/10" },
  password_reset_complete: { label: "Password reposta", color: "text-amber-400 bg-amber-400/10" },
  ficheiro_upload:      { label: "Upload ficheiro",    color: "text-blue-400 bg-blue-400/10" },
  ficheiro_edit:        { label: "Editou ficheiro",    color: "text-purple-400 bg-purple-400/10" },
  ficheiro_delete:      { label: "Eliminou ficheiro",  color: "text-red-400 bg-red-400/10" },
  ficheiro_site_publico:{ label: "Publicou ficheiro",  color: "text-emerald-400 bg-emerald-400/10" },
  user_create:          { label: "Criou utilizador",   color: "text-blue-400 bg-blue-400/10" },
  user_approve:         { label: "Aprovou utilizador", color: "text-emerald-400 bg-emerald-400/10" },
  user_reject:          { label: "Rejeitou utilizador",color: "text-red-400 bg-red-400/10" },
  user_delete:          { label: "Eliminou utilizador",color: "text-red-400 bg-red-400/10" },
  user_role_change:     { label: "Mudou cargo",        color: "text-amber-400 bg-amber-400/10" },
  user_status_change:   { label: "Mudou estado",       color: "text-amber-400 bg-amber-400/10" },
  mensagem_send:        { label: "Mensagem enviada",   color: "text-cyan-400 bg-cyan-400/10" },
  mensagem_broadcast:   { label: "Broadcast",          color: "text-cyan-400 bg-cyan-400/10" },
  mensagem_delete:      { label: "Eliminou mensagem",  color: "text-red-400 bg-red-400/10" },
  tarefa_create:        { label: "Criou tarefa",       color: "text-indigo-400 bg-indigo-400/10" },
  tarefa_delete:        { label: "Eliminou tarefa",    color: "text-red-400 bg-red-400/10" },
  tarefa_status_change: { label: "Estado tarefa",      color: "text-indigo-400 bg-indigo-400/10" },
  turma_create:         { label: "Criou turma",        color: "text-teal-400 bg-teal-400/10" },
  turma_delete:         { label: "Eliminou turma",     color: "text-red-400 bg-red-400/10" },
  turma_membro_add:     { label: "Adicionou membro",   color: "text-teal-400 bg-teal-400/10" },
  turma_membro_remove:  { label: "Removeu membro",     color: "text-red-400 bg-red-400/10" },
  post_create:          { label: "Publicou post",      color: "text-pink-400 bg-pink-400/10" },
  post_delete:          { label: "Eliminou post",      color: "text-red-400 bg-red-400/10" },
  comentario_create:    { label: "Comentou",           color: "text-pink-400 bg-pink-400/10" },
  comentario_delete:    { label: "Eliminou comentário",color: "text-red-400 bg-red-400/10" },
  evento_create:        { label: "Criou evento",       color: "text-orange-400 bg-orange-400/10" },
  evento_delete:        { label: "Eliminou evento",    color: "text-red-400 bg-red-400/10" },
  anuncio_create:       { label: "Enviou anúncio",     color: "text-yellow-400 bg-yellow-400/10" },
  approve_formando:     { label: "Aprovou formando",   color: "text-emerald-400 bg-emerald-400/10" },
  reject_formando:      { label: "Rejeitou formando",  color: "text-red-400 bg-red-400/10" },
  approve_formador:     { label: "Aprovou formador",   color: "text-emerald-400 bg-emerald-400/10" },
  reject_formador:      { label: "Rejeitou formador",  color: "text-red-400 bg-red-400/10" },
  role_change:          { label: "Mudou cargo",        color: "text-amber-400 bg-amber-400/10" },
};

function formatDT(d: string) {
  return new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AuditLogPage() {
  const { user } = useAdminUser();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterActor, setFilterActor] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [users, setUsers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard");
  }, [user, isAdmin]);

  useEffect(() => {
    fetch("/api/db/profiles?orderBy=first_name&ascending=true")
      .then(r => r.json()).then(j => setUsers(j.data ?? []));
  }, []);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (filterActor) params.set("actor", filterActor);
    if (filterAction) params.set("action", filterAction);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/audit-log?${params}`);
    const json = await res.json();
    setLogs(json.data ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setPage(p);
    setLoading(false);
  }, [filterActor, filterAction, filterFrom, filterTo]);

  useEffect(() => { if (isAdmin) fetchLogs(1); }, [isAdmin, filterActor, filterAction, filterFrom, filterTo]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Shield size={16} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold c-tx">Audit Log</h1>
          <p className="text-[11px] c-tx4">{total.toLocaleString("pt-PT")} registos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="c-bg2 border c-br rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="c-tx4" />
          <span className="text-xs c-tx3 font-medium">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] c-tx4 mb-1 block">Utilizador</label>
            <select value={filterActor} onChange={e => setFilterActor(e.target.value)}
              className="w-full c-s1 border c-br rounded-lg px-2 py-1.5 text-xs c-tx outline-none">
              <option value="">Todos</option>
              {users.map(u => (
                <option key={u.id} value={u.id} className="c-bg">{u.first_name} {u.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] c-tx4 mb-1 block">Acção</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="w-full c-s1 border c-br rounded-lg px-2 py-1.5 text-xs c-tx outline-none">
              <option value="">Todas</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k} className="c-bg">{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] c-tx4 mb-1 block">De</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="w-full c-s1 border c-br rounded-lg px-2 py-1.5 text-xs c-tx outline-none [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-[10px] c-tx4 mb-1 block">Até</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="w-full c-s1 border c-br rounded-lg px-2 py-1.5 text-xs c-tx outline-none [color-scheme:dark]" />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="c-bg2 border c-br rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b c-br">
                <th className="text-left text-[10px] c-tx4 font-semibold uppercase tracking-wider px-4 py-3">Data/Hora</th>
                <th className="text-left text-[10px] c-tx4 font-semibold uppercase tracking-wider px-4 py-3">Utilizador</th>
                <th className="text-left text-[10px] c-tx4 font-semibold uppercase tracking-wider px-4 py-3">Acção</th>
                <th className="text-left text-[10px] c-tx4 font-semibold uppercase tracking-wider px-4 py-3">Alvo / Detalhes</th>
                <th className="text-left text-[10px] c-tx4 font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b c-br">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-white/[0.04] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs c-tx5">Nenhum registo encontrado.</td>
                </tr>
              ) : logs.map(log => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-slate-400 bg-slate-400/10" };
                const actorName = log.actor_nome ? `${log.actor_nome} ${log.actor_apelido ?? ""}`.trim() : "Sistema";
                const targetName = log.target_nome ? `${log.target_nome} ${log.target_apelido ?? ""}`.trim() : null;

                let detail = "";
                if (log.details) {
                  if (log.details.label) detail = log.details.label;
                  else if (log.details.titulo) detail = log.details.titulo;
                  else if (log.details.preview) detail = log.details.preview;
                  else if (log.details.nome) detail = log.details.nome;
                  else if (log.details.sent) detail = `${log.details.sent} destinatários`;
                  else if (log.details.estado) detail = `estado: ${log.details.estado}`;
                }
                if (targetName && !detail) detail = targetName;
                else if (targetName && detail) detail = `${targetName} · ${detail}`;

                return (
                  <tr key={log.id} className="border-b c-br hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-[11px] c-tx4 whitespace-nowrap">{formatDT(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs c-tx2 font-medium">{actorName}</p>
                        {log.actor_role && <p className="text-[10px] c-tx5 capitalize">{log.actor_role}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] c-tx3 max-w-xs truncate">{detail || "—"}</td>
                    <td className="px-4 py-3 text-[10px] c-tx5 hidden lg:table-cell font-mono">{log.ip || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t c-br">
            <span className="text-[11px] c-tx4">Página {page} de {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded-lg c-br border c-tx4 hover:c-tx hc-s1 transition-colors disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => fetchLogs(page + 1)} disabled={page >= pages}
                className="p-1.5 rounded-lg c-br border c-tx4 hover:c-tx hc-s1 transition-colors disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
