"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  Users, FolderOpen, Calendar, Loader2, HardDrive,
  Trophy, TrendingUp, Upload, BarChart3, MessageSquare, LifeBuoy
} from "lucide-react";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  "super-admin": "Super Admin", admin: "Admin", formador: "Formador", formando: "Formando",
};

const AREA_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500",
  "bg-amber-500", "bg-red-500", "bg-pink-500",
];

function fmt(bytes: number) {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + " TB";
  if (bytes >= 1e9)  return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6)  return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useAdminUser();
  const [analytics, setAnalytics] = useState<any>(null);
  const [disk, setDisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  useEffect(() => {
    async function load() {
      try {
        const [aRes] = await Promise.all([
          fetch("/api/analytics"),
        ]);
        const a = await aRes.json();
        setAnalytics(a);
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
  const topUploaders: any[] = analytics?.topUploaders ?? [];
  const topAreas: any[] = analytics?.topAreas ?? [];
  const topContrib: any[] = analytics?.recentLogins ?? [];
  const eventos: any[] = analytics?.eventosRecentes ?? [];
  const maxArea = topAreas[0]?.total ? Number(topAreas[0].total) : 1;
  const maxUpload = topUploaders[0]?.total ? Number(topUploaders[0].total) : 1;

  return (
    <div className="space-y-6 w-full">

      {/* Boas-vindas */}
      <div>
        <h2 className="text-lg font-semibold c-tx">
          Olá, {user?.first_name ?? "utilizador"} 👋
        </h2>
        <p className="text-sm c-tx3 mt-0.5">Aqui está o pulso da plataforma.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Utilizadores", value: t.total_users ?? "—", icon: Users, color: "text-blue-400 bg-blue-500/10", href: "/dashboard/admin" },
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

      {/* Linha 2: Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Uploaders */}
        <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-emerald-400" />
            <h3 className="text-sm font-semibold c-tx">Quem mais contribui</h3>
          </div>
          {topUploaders.length === 0 ? (
            <p className="text-xs c-tx4 py-4 text-center">Sem dados ainda.</p>
          ) : (
            <ol className="space-y-3">
              {topUploaders.map((u, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-amber-400" : i === 1 ? "c-tx3" : i === 2 ? "text-amber-700" : "c-tx4"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs c-tx2 truncate">{u.first_name} {u.last_name}</span>
                      <span className="text-xs c-tx3 shrink-0 ml-2">{u.total}</span>
                    </div>
                    <div className="h-1.5 c-s2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${(Number(u.total) / maxUpload) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Top Áreas */}
        <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold c-tx">Áreas mais activas</h3>
          </div>
          {topAreas.length === 0 ? (
            <p className="text-xs c-tx4 py-4 text-center">Sem dados ainda.</p>
          ) : (
            <ol className="space-y-3">
              {topAreas.map((a, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs c-tx2 truncate">{a.area}</span>
                    <span className="text-xs c-tx3 shrink-0 ml-2">{a.total} fich.</span>
                  </div>
                  <div className="h-1.5 c-s2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${AREA_COLORS[i % AREA_COLORS.length]}/60`}
                      style={{ width: `${(Number(a.total) / maxArea) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Utilizadores mais activos (contribuições) */}
        <div className="c-bg2 border c-br rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold c-tx">Mais activos na plataforma</h3>
          </div>
          {topContrib.length === 0 ? (
            <p className="text-xs c-tx4 py-4 text-center">Sem dados ainda.</p>
          ) : (
            <ol className="space-y-3">
              {topContrib.map((u, i) => {
                const maxC = Number(topContrib[0]?.contribuicoes) || 1;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-amber-400" : i === 1 ? "c-tx3" : i === 2 ? "text-amber-700" : "c-tx4"}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs c-tx2 truncate">{u.first_name} {u.last_name}</span>
                          <span className="text-[9px] c-tx4 ml-1.5">{ROLE_LABEL[u.role] ?? u.role}</span>
                        </div>
                        <span className="text-xs c-tx3 shrink-0 ml-2">{u.contribuicoes}</span>
                      </div>
                      <div className="h-1.5 c-s2 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${(Number(u.contribuicoes) / maxC) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Linha 3: Próximos eventos + tickets + disco */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

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

        {/* Disco */}
        {disk && (
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
