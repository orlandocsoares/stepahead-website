"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  Users, FolderOpen, Calendar, Loader2, HardDrive,
  MessageSquare, LifeBuoy,
  ClipboardList, Bell, Mail, CalendarClock, ArrowRight, GraduationCap,
} from "lucide-react";
import Link from "next/link";

function fmt(bytes: number) {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + " TB";
  if (bytes >= 1e9)  return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6)  return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

type TarefaResumo = {
  id: string; titulo: string; prazo?: string;
  estado?: string; total?: number; entregues?: number; acao_designacao?: string;
};

function formatPrazo(d: string) {
  const dias = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (dias < 0) return { texto: "Atrasado", cor: "text-red-400" };
  if (dias === 0) return { texto: "Hoje", cor: "text-amber-400" };
  if (dias === 1) return { texto: "Amanhã", cor: "text-amber-400" };
  return { texto: `${dias} dias`, cor: "c-tx4" };
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useAdminUser();
  const [analytics, setAnalytics] = useState<any>(null);
  const [disk, setDisk] = useState<any>(null);
  const [tarefas, setTarefas] = useState<TarefaResumo[]>([]);
  const [notifs, setNotifs] = useState<{ notificacoes: any[]; unread: number }>({ notificacoes: [], unread: 0 });
  const [mensagensUnread, setMensagensUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const isFormando = user?.role === "formando";
  // Formando não gere a plataforma — rankings, armazenamento e a listagem de
  // utilizadores não fazem parte do seu trabalho diário, só acrescentam ruído.
  const isStaff = isAdmin || user?.role === "formador";

  useEffect(() => {
    async function load() {
      try {
        const [aRes, tRes, nRes, mRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/tarefas"),
          fetch("/api/notificacoes?limit=5"),
          fetch("/api/mensagens?unread=1"),
        ]);
        setAnalytics(await aRes.json());
        setTarefas((await tRes.json()).tarefas ?? []);
        setNotifs(await nRes.json());
        setMensagensUnread((await mRes.json()).count ?? 0);
        fetch("/api/system/disk").then(r => r.ok ? r.json() : null).then(d => { if (d && !d.error) setDisk(d); });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (userLoading || loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;
  }

  const t = analytics?.totals ?? {};
  const eventos: any[] = analytics?.eventosRecentes ?? [];

  const tarefasPendentes = isFormando
    ? tarefas.filter(x => x.estado === "pendente" || !x.estado)
    : tarefas.filter(x => Number(x.total ?? 0) > Number(x.entregues ?? 0));
  const prazosProximos = tarefasPendentes
    .filter(x => x.prazo)
    .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 w-full">

      {/* Boas-vindas */}
      <div id="tour-dash-welcome">
        <h2 className="text-lg font-semibold c-tx">
          Olá, {user?.first_name ?? "utilizador"} 👋
        </h2>
        <p className="text-sm c-tx3 mt-0.5">Aqui está o que precisa da sua atenção hoje.</p>
      </div>

      {/* Centro de Trabalho — o que precisa de acção agora, sempre visível a todos os perfis */}
      <div id="tour-centro-trabalho" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/dashboard/tarefas"
          className="c-bg2 border c-br rounded-xl p-4 flex items-center gap-3 hover:border-amber-500/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-amber-400 bg-amber-500/10">
            <ClipboardList size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold c-tx leading-none">{tarefasPendentes.length}</p>
            <p className="text-[10px] c-tx3 mt-0.5 truncate">{isFormando ? "tarefas por entregar" : "tarefas por avaliar"}</p>
          </div>
        </Link>

        <Link href="/dashboard/notificacoes"
          className="c-bg2 border c-br rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-blue-400 bg-blue-500/10">
            <Bell size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold c-tx leading-none">{notifs.unread}</p>
            <p className="text-[10px] c-tx3 mt-0.5 truncate">notificações por ler</p>
          </div>
        </Link>

        <Link href="/dashboard/mensagens"
          className="c-bg2 border c-br rounded-xl p-4 flex items-center gap-3 hover:border-pink-500/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-pink-400 bg-pink-500/10">
            <Mail size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold c-tx leading-none">{mensagensUnread}</p>
            <p className="text-[10px] c-tx3 mt-0.5 truncate">mensagens por ler</p>
          </div>
        </Link>

        <Link href={isFormando ? "/dashboard/minhas-formacoes" : "/dashboard/agenda"}
          className="c-bg2 border c-br rounded-xl p-4 flex items-center gap-3 hover:border-purple-500/30 transition-colors group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-purple-400 bg-purple-500/10">
            <GraduationCap size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold c-tx leading-none">{eventos.length}</p>
            <p className="text-[10px] c-tx3 mt-0.5 truncate">próximas formações</p>
          </div>
        </Link>
      </div>

      {/* Prazos mais próximos + acessos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={14} className="text-amber-400" />
              <h3 className="text-sm font-semibold c-tx">Prazos mais próximos</h3>
            </div>
            <Link href="/dashboard/tarefas" className="text-xs text-blue-400 hover:text-blue-300">Ver todas</Link>
          </div>
          {prazosProximos.length === 0 ? (
            <p className="text-xs c-tx4 py-4 text-center">Sem prazos próximos.</p>
          ) : (
            <ul className="space-y-2.5">
              {prazosProximos.map(x => {
                const p = formatPrazo(x.prazo!);
                return (
                  <li key={x.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium c-tx truncate">{x.titulo}</p>
                      {x.acao_designacao && <p className="text-[10px] c-tx5 truncate">{x.acao_designacao}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold shrink-0 ${p.cor}`}>{p.texto}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="c-bg2 border c-br rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold c-tx flex items-center gap-2"><ArrowRight size={14} className="text-blue-400" /> Acessos rápidos</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "As Minhas Formações", href: "/dashboard/minhas-formacoes" },
              { label: "Tarefas", href: "/dashboard/tarefas" },
              { label: "Repositório", href: "/dashboard/ficheiros" },
              { label: "Agenda", href: "/dashboard/agenda" },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="text-xs c-tx3 hover:c-tx2 c-s1 hc-s2 border c-br rounded-lg px-3 py-2.5 transition-colors">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div id="tour-kpi-cards" className={`grid grid-cols-2 gap-3 ${isStaff ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {[
          ...(isStaff ? [{ label: "Utilizadores", value: t.total_users ?? "—", icon: Users, color: "text-blue-400 bg-blue-500/10", href: "/dashboard/admin" }] : []),
          { label: "Ficheiros", value: t.total_ficheiros ?? "—", icon: FolderOpen, color: "text-emerald-400 bg-emerald-500/10", href: "/dashboard/ficheiros" },
          { label: "Eventos este mês", value: t.eventos_mes ?? "—", icon: Calendar, color: "text-purple-400 bg-purple-500/10", href: "/dashboard/agenda" },
          { label: "Publicações", value: t.total_posts ?? "—", icon: MessageSquare, color: "text-amber-400 bg-amber-500/10", href: "/dashboard/comunidade" },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="c-bg2 border c-br rounded-xl p-4 flex items-center gap-3 hover:border-white/[0.14] transition-colors group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-xl font-bold c-tx leading-none">{s.value}</p>
              <p className="text-[10px] c-tx3 mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Linha 3: Próximos eventos + tickets + disco */}
      <div id="tour-dash-stats" className={`grid grid-cols-1 gap-4 ${isStaff ? "lg:grid-cols-3" : ""}`}>

        {/* Próximos eventos */}
        <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-purple-400" />
              <h3 className="text-sm font-semibold c-tx">Próximos eventos</h3>
            </div>
            <Link href="/dashboard/agenda" className="text-xs text-blue-400 hover:text-blue-300">Ver todos</Link>
          </div>
          {eventos.length === 0 ? (
            <p className="text-xs c-tx4 py-4 text-center">Sem eventos futuros.</p>
          ) : (
            <ul className="space-y-3">
              {eventos.map((e, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-400 text-[10px] font-bold">
                    {formatDate(e.data_evento)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium c-tx truncate">{e.titulo}</p>
                    <p className="text-[10px] c-tx4">{e.local}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tickets pendentes — só admin */}
        {isAdmin && (
          <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy size={14} className="text-amber-400" />
                <h3 className="text-sm font-semibold c-tx">Suporte</h3>
              </div>
              <Link href="/dashboard/suporte" className="text-xs text-blue-400 hover:text-blue-300">Ver todos</Link>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <p className={`text-5xl font-bold ${Number(t.tickets_pendentes) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {t.tickets_pendentes ?? "0"}
                </p>
                <p className="text-xs c-tx4 mt-1">ticket{Number(t.tickets_pendentes) !== 1 ? "s" : ""} pendente{Number(t.tickets_pendentes) !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disco — preocupação de infraestrutura, só faz sentido para quem administra */}
        {isStaff && disk && (
          <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive size={14} className="text-slate-400" />
              <h3 className="text-sm font-semibold c-tx">Armazenamento</h3>
            </div>
            <div className="flex items-center justify-center py-2">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={disk.pct >= 90 ? "#ef4444" : disk.pct >= 70 ? "#f59e0b" : "#10b981"}
                    strokeWidth="3" strokeDasharray={`${disk.pct} ${100 - disk.pct}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={`text-lg font-bold ${disk.pct >= 90 ? "text-red-400" : disk.pct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>{disk.pct}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
