"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Shield, Filter, LayoutGrid, List, X, Clock, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type LogEntry = {
  id: string;
  action: string;
  actor_id?: string;
  actor_nome?: string;
  actor_apelido?: string;
  actor_role?: string;
  actor_avatar?: string;
  target_nome?: string;
  target_apelido?: string;
  ip?: string;
  details?: Record<string, any>;
  created_at: string;
};

type UserSummary = {
  id: string;
  nome: string;
  role: string;
  avatar?: string;
  total: number;
  last_action: string;
  actions: Record<string, number>;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login_success:            { label: "Login",               color: "text-emerald-400 bg-emerald-400/10" },
  login_fail:               { label: "Login falhado",       color: "text-red-400 bg-red-400/10" },
  logout:                   { label: "Logout",              color: "text-slate-400 bg-slate-400/10" },
  register:                 { label: "Registo",             color: "text-blue-400 bg-blue-400/10" },
  password_change:          { label: "Password alterada",   color: "text-amber-400 bg-amber-400/10" },
  password_reset_request:   { label: "Reset password",      color: "text-amber-400 bg-amber-400/10" },
  password_reset_complete:  { label: "Password reposta",    color: "text-amber-400 bg-amber-400/10" },
  ficheiro_upload:          { label: "Upload ficheiro",     color: "text-blue-400 bg-blue-400/10" },
  ficheiro_edit:            { label: "Editou ficheiro",     color: "text-purple-400 bg-purple-400/10" },
  ficheiro_delete:          { label: "Eliminou ficheiro",   color: "text-red-400 bg-red-400/10" },
  ficheiro_site_publico:    { label: "Publicou ficheiro",   color: "text-emerald-400 bg-emerald-400/10" },
  user_create:              { label: "Criou utilizador",    color: "text-blue-400 bg-blue-400/10" },
  user_approve:             { label: "Aprovou utilizador",  color: "text-emerald-400 bg-emerald-400/10" },
  user_reject:              { label: "Rejeitou utilizador", color: "text-red-400 bg-red-400/10" },
  user_delete:              { label: "Eliminou utilizador", color: "text-red-400 bg-red-400/10" },
  user_role_change:         { label: "Mudou cargo",         color: "text-amber-400 bg-amber-400/10" },
  user_status_change:       { label: "Mudou estado",        color: "text-amber-400 bg-amber-400/10" },
  mensagem_send:            { label: "Mensagem enviada",    color: "text-cyan-400 bg-cyan-400/10" },
  mensagem_broadcast:       { label: "Broadcast",           color: "text-cyan-400 bg-cyan-400/10" },
  mensagem_delete:          { label: "Eliminou mensagem",   color: "text-red-400 bg-red-400/10" },
  tarefa_create:            { label: "Criou tarefa",        color: "text-indigo-400 bg-indigo-400/10" },
  tarefa_delete:            { label: "Eliminou tarefa",     color: "text-red-400 bg-red-400/10" },
  tarefa_status_change:     { label: "Estado tarefa",       color: "text-indigo-400 bg-indigo-400/10" },
  turma_create:             { label: "Criou turma",         color: "text-teal-400 bg-teal-400/10" },
  turma_delete:             { label: "Eliminou turma",      color: "text-red-400 bg-red-400/10" },
  turma_membro_add:         { label: "Adicionou membro",    color: "text-teal-400 bg-teal-400/10" },
  turma_membro_remove:      { label: "Removeu membro",      color: "text-red-400 bg-red-400/10" },
  post_create:              { label: "Publicou post",       color: "text-pink-400 bg-pink-400/10" },
  post_update:              { label: "Editou post",         color: "text-purple-400 bg-purple-400/10" },
  post_delete:              { label: "Eliminou post",       color: "text-red-400 bg-red-400/10" },
  comentario_create:        { label: "Comentou",            color: "text-pink-400 bg-pink-400/10" },
  comentario_delete:        { label: "Eliminou comentário", color: "text-red-400 bg-red-400/10" },
  gosto_create:             { label: "Gostou de post",      color: "text-pink-400 bg-pink-400/10" },
  gosto_delete:             { label: "Removeu gosto",       color: "text-red-400 bg-red-400/10" },
  evento_create:            { label: "Criou evento",        color: "text-orange-400 bg-orange-400/10" },
  evento_update:            { label: "Editou evento",       color: "text-purple-400 bg-purple-400/10" },
  evento_delete:            { label: "Eliminou evento",     color: "text-red-400 bg-red-400/10" },
  inscricao_create:         { label: "Inscreveu-se",        color: "text-orange-400 bg-orange-400/10" },
  inscricao_delete:         { label: "Cancelou inscrição",  color: "text-red-400 bg-red-400/10" },
  ticket_create:            { label: "Abriu ticket",        color: "text-indigo-400 bg-indigo-400/10" },
  ticket_update:            { label: "Atualizou ticket",    color: "text-purple-400 bg-purple-400/10" },
  ticket_delete:            { label: "Eliminou ticket",     color: "text-red-400 bg-red-400/10" },
  document_create:          { label: "Criou documento",     color: "text-blue-400 bg-blue-400/10" },
  document_update:          { label: "Editou documento",    color: "text-purple-400 bg-purple-400/10" },
  document_delete:          { label: "Eliminou documento",  color: "text-red-400 bg-red-400/10" },
  profile_update:           { label: "Editou perfil",       color: "text-purple-400 bg-purple-400/10" },
  anuncio_create:           { label: "Enviou anúncio",      color: "text-yellow-400 bg-yellow-400/10" },
  approve_formando:         { label: "Aprovou formando",    color: "text-emerald-400 bg-emerald-400/10" },
  reject_formando:          { label: "Rejeitou formando",   color: "text-red-400 bg-red-400/10" },
  approve_formador:         { label: "Aprovou formador",    color: "text-emerald-400 bg-emerald-400/10" },
  reject_formador:          { label: "Rejeitou formador",   color: "text-red-400 bg-red-400/10" },
  role_change:              { label: "Mudou cargo",         color: "text-amber-400 bg-amber-400/10" },
};

function fmtDT(d: string) {
  return new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function logDetail(log: LogEntry): string {
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
  return detail || "—";
}

export default function AuditLogPage() {
  const { user } = useAdminUser();
  const router = useRouter();
  const [view, setView] = useState<"cards" | "list">("cards");

  // Lista
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

  // Cards
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
  const [userLogsLoading, setUserLogsLoading] = useState(false);
  const [userLogsPage, setUserLogsPage] = useState(1);
  const [userLogsPages, setUserLogsPages] = useState(1);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  useEffect(() => { if (user && !isAdmin) router.replace("/dashboard"); }, [user, isAdmin]);

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

    // Construir sumários por utilizador a partir dos dados
    if (p === 1 && !filterActor) {
      const allRes = await fetch(`/api/admin/audit-log?page=1&limit=500`);
      const allJson = await allRes.json();
      const allLogs: LogEntry[] = allJson.data ?? [];
      const map = new Map<string, UserSummary>();
      for (const l of allLogs) {
        if (!l.actor_id) continue;
        const nome = l.actor_nome ? `${l.actor_nome} ${l.actor_apelido ?? ""}`.trim() : "Sistema";
        if (!map.has(l.actor_id)) {
          map.set(l.actor_id, { id: l.actor_id, nome, role: l.actor_role ?? "", avatar: l.actor_avatar, total: 0, last_action: l.created_at, actions: {} });
        }
        const s = map.get(l.actor_id)!;
        s.total++;
        s.actions[l.action] = (s.actions[l.action] ?? 0) + 1;
        if (new Date(l.created_at) > new Date(s.last_action)) s.last_action = l.created_at;
      }
      setUserSummaries(Array.from(map.values()).sort((a, b) => new Date(b.last_action).getTime() - new Date(a.last_action).getTime()));
    }
  }, [filterActor, filterAction, filterFrom, filterTo]);

  useEffect(() => { if (isAdmin) fetchLogs(1); }, [isAdmin, filterActor, filterAction, filterFrom, filterTo]);

  async function openUserPanel(u: UserSummary, p = 1) {
    setSelectedUser(u);
    setUserLogsLoading(true);
    const res = await fetch(`/api/admin/audit-log?actor=${u.id}&page=${p}&limit=20`);
    const json = await res.json();
    setUserLogs(json.data ?? []);
    setUserLogsPage(p);
    setUserLogsPages(json.pages ?? 1);
    setUserLogsLoading(false);
  }

  if (!isAdmin) return null;

  const roleLabel: Record<string, string> = { "super-admin": "Super Admin", admin: "Admin", formador: "Formador", formando: "Formando" };

  return (
    <div className="space-y-5 max-w-full">
      {/* Cabeçalho */}
      <div id="tour-audit-header" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield size={16} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold c-tx">Audit Log</h1>
            <p className="text-[11px] c-tx4">{total.toLocaleString("pt-PT")} registos</p>
          </div>
        </div>
        <div className="flex items-center gap-1 c-bg2 border c-br rounded-lg p-1">
          <button onClick={() => setView("cards")} className={`p-1.5 rounded transition-colors ${view === "cards" ? "bg-blue-600 text-white" : "c-tx4 hc-tx"}`}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded transition-colors ${view === "list" ? "bg-blue-600 text-white" : "c-tx4 hc-tx"}`}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* VISTA CARTÕES */}
      {view === "cards" && (
        <div id="tour-audit-cards">
          {userSummaries.length === 0 && loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="c-bg2 border c-br rounded-xl p-4 h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {userSummaries.map((u, i) => {
                const topActions = Object.entries(u.actions).sort((a, b) => b[1] - a[1]).slice(0, 3);
                const initials = u.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <motion.div key={u.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                    onClick={() => openUserPanel(u)}
                    className="c-bg2 border c-br rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/[0.03] transition-all group"
                  >
                    {/* Avatar + nome */}
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-base font-bold overflow-hidden shrink-0">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.nome} /> : initials}
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-semibold c-tx truncate">{u.nome}</p>
                        <p className="text-[9px] c-tx5">{roleLabel[u.role] ?? u.role}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="border-t c-br pt-2 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] c-tx5 flex items-center gap-1"><Activity size={9} /> Acções</span>
                        <span className="text-[10px] font-bold text-blue-400">{u.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] c-tx5 flex items-center gap-1"><Clock size={9} /> Último</span>
                        <span className="text-[9px] c-tx4">{fmtRelative(u.last_action)}</span>
                      </div>
                    </div>

                    {/* Top acções */}
                    <div className="space-y-1">
                      {topActions.map(([action, count]) => {
                        const meta = ACTION_LABELS[action] ?? { label: action, color: "text-slate-400 bg-slate-400/10" };
                        return (
                          <div key={action} className="flex items-center justify-between gap-1">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium truncate ${meta.color}`}>{meta.label}</span>
                            <span className="text-[9px] c-tx5 shrink-0">{count}×</span>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[8px] text-blue-400/50 text-center group-hover:text-blue-400 transition-colors">Ver actividade →</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA LISTA */}
      {view === "list" && (
        <>
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
                  {loading ? Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} className="border-b c-br">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-white/[0.04] rounded animate-pulse w-3/4" /></td>
                      ))}
                    </tr>
                  )) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-xs c-tx5">Nenhum registo encontrado.</td></tr>
                  ) : logs.map(log => {
                    const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-slate-400 bg-slate-400/10" };
                    const actorName = log.actor_nome ? `${log.actor_nome} ${log.actor_apelido ?? ""}`.trim() : "Sistema";
                    return (
                      <tr key={log.id} className="border-b c-br hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[11px] c-tx4 whitespace-nowrap">{fmtDT(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs c-tx2 font-medium">{actorName}</p>
                          {log.actor_role && <p className="text-[10px] c-tx5 capitalize">{log.actor_role}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] c-tx3 max-w-xs truncate">{logDetail(log)}</td>
                        <td className="px-4 py-3 text-[10px] c-tx5 hidden lg:table-cell font-mono">{log.ip || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t c-br">
                <span className="text-[11px] c-tx4">Página {page} de {pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg c-br border c-tx4 hover:c-tx hc-s1 transition-colors disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <button onClick={() => fetchLogs(page + 1)} disabled={page >= pages} className="p-1.5 rounded-lg c-br border c-tx4 hover:c-tx hc-s1 transition-colors disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* PAINEL LATERAL — actividade do utilizador */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]" onClick={() => setSelectedUser(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-md c-bg border-l c-br z-[201] flex flex-col shadow-2xl">

              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b c-br shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm overflow-hidden shrink-0">
                  {selectedUser.avatar
                    ? <img src={selectedUser.avatar} className="w-full h-full object-cover" alt={selectedUser.nome} />
                    : selectedUser.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold c-tx">{selectedUser.nome}</p>
                  <p className="text-[10px] c-tx5">{roleLabel[selectedUser.role] ?? selectedUser.role} · {selectedUser.total} acções registadas</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg c-tx4 hover:c-tx hc-s1 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {userLogsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-14 c-bg2 border c-br rounded-xl animate-pulse" />
                  ))
                ) : userLogs.length === 0 ? (
                  <p className="text-xs c-tx5 text-center py-12">Nenhuma acção registada.</p>
                ) : userLogs.map((log, i) => {
                  const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-slate-400 bg-slate-400/10" };
                  return (
                    <motion.div key={log.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                      className="flex gap-3 c-bg2 border c-br rounded-xl px-4 py-3">
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <div className={`w-2 h-2 rounded-full mt-1 ${meta.color.split(" ")[0].replace("text-", "bg-")}`} />
                        {i < userLogs.length - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                          <span className="text-[9px] c-tx5">{fmtRelative(log.created_at)}</span>
                        </div>
                        {logDetail(log) !== "—" && (
                          <p className="text-[11px] c-tx4 mt-1 truncate">{logDetail(log)}</p>
                        )}
                        <p className="text-[9px] c-tx5 mt-0.5">{fmtDT(log.created_at)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Paginação do painel */}
              {userLogsPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t c-br shrink-0">
                  <span className="text-[11px] c-tx4">Página {userLogsPage} de {userLogsPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openUserPanel(selectedUser, userLogsPage - 1)} disabled={userLogsPage <= 1}
                      className="p-1.5 rounded-lg c-br border c-tx4 hover:c-tx hc-s1 transition-colors disabled:opacity-30"><ChevronLeft size={14} /></button>
                    <button onClick={() => openUserPanel(selectedUser, userLogsPage + 1)} disabled={userLogsPage >= userLogsPages}
                      className="p-1.5 rounded-lg c-br border c-tx4 hover:c-tx hc-s1 transition-colors disabled:opacity-30"><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
