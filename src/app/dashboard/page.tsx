"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Users, FolderOpen, FileText, Calendar, Loader2, Clock, ChevronRight, HardDrive } from "lucide-react";
import Link from "next/link";

type Stat = { label: string; value: number | string; icon: React.ElementType; color: string; href: string };

function StatCard({ label, value, icon: Icon, color, href }: Stat) {
  return (
    <Link
      href={href}
      className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4 hover:border-white/[0.12] hover:bg-[#16162a] transition-colors group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-semibold text-white">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
      </div>
      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
    </Link>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useAdminUser();
  const [counts, setCounts] = useState({ utilizadores: 0, ficheiros: 0, tickets: 0, agenda: 0 });
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [recentAgenda, setRecentAgenda] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disk, setDisk] = useState<{ total: number; used: number; avail: number; pct: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [profRes, arquivosRes, agendaRes, ticketsRes] = await Promise.all([
          fetch("/api/db/profiles"),
          fetch("/api/db/arquivos?orderBy=created_at&ascending=false&limit=5"),
          fetch("/api/db/agenda_atividades?orderBy=data_evento&ascending=true&limit=3"),
          fetch("/api/db/tickets?orderBy=created_at&ascending=false&limit=5"),
        ]);

        const [profData, arquivosData, agendaData, ticketsData] = await Promise.all([
          profRes.json(), arquivosRes.json(), agendaRes.json(), ticketsRes.json(),
        ]);

        setCounts({
          utilizadores: profData.data?.length ?? 0,
          ficheiros: arquivosData.data?.length ?? 0,
          tickets: ticketsData.data?.filter((t: any) => t.status === "Pendente").length ?? 0,
          agenda: agendaData.data?.length ?? 0,
        });
        setRecentFiles(arquivosData.data ?? []);
        setRecentAgenda(agendaData.data ?? []);
        setRecentTickets(ticketsData.data ?? []);

        // Disco — falha silenciosa se não disponível
        fetch("/api/system/disk").then(r => r.ok ? r.json() : null).then(d => { if (d && !d.error) setDisk(d); });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  const stats: Stat[] = [
    { label: "Utilizadores", value: counts.utilizadores, icon: Users, color: "bg-blue-500/10 text-blue-400", href: "/dashboard/utilizadores" },
    { label: "Ficheiros", value: counts.ficheiros, icon: FolderOpen, color: "bg-emerald-500/10 text-emerald-400", href: "/dashboard/ficheiros" },
    { label: "Tickets pendentes", value: counts.tickets, icon: FileText, color: "bg-amber-500/10 text-amber-400", href: "/dashboard/suporte" },
    { label: "Próximas actividades", value: counts.agenda, icon: Calendar, color: "bg-purple-500/10 text-purple-400", href: "/dashboard/agenda" },
  ];

  return (
    <div className="space-y-6 w-full">

      {/* Boas-vindas */}
      <div>
        <h2 className="text-lg font-semibold text-white">
          Olá, {user?.first_name ?? "utilizador"} 👋
        </h2>
        <p className="text-sm text-white/40 mt-0.5">Aqui está o resumo do sistema.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Conteúdo inferior: ficheiros + agenda + tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Ficheiros recentes */}
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Ficheiros recentes</h3>
            <Link href="/dashboard/ficheiros" className="text-xs text-blue-400 hover:text-blue-300">Ver todos</Link>
          </div>
          {recentFiles.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">Sem ficheiros.</p>
          ) : (
            <ul className="space-y-3">
              {recentFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <FolderOpen size={14} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{f.label}</p>
                    <p className="text-[10px] text-white/30">{f.area} · {formatDate(f.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agenda */}
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Próximas actividades</h3>
            <Link href="/dashboard/agenda" className="text-xs text-blue-400 hover:text-blue-300">Ver todas</Link>
          </div>
          {recentAgenda.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">Sem actividades.</p>
          ) : (
            <ul className="space-y-3">
              {recentAgenda.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{a.titulo}</p>
                    <p className="text-[10px] text-white/30">{a.local} · {formatDate(a.data_evento)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tickets recentes */}
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Tickets de suporte</h3>
            <Link href="/dashboard/suporte" className="text-xs text-blue-400 hover:text-blue-300">Ver todos</Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">Sem tickets.</p>
          ) : (
            <ul className="space-y-3">
              {recentTickets.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={14} className="text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        t.status === "Pendente" ? "bg-amber-500/10 text-amber-400"
                        : t.status === "Resolvido" ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/5 text-white/30"
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-white/30">{t.category}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* Cartão de disco */}
      {disk && (
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
              <HardDrive size={15} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Armazenamento do servidor</p>
              <p className="text-[10px] text-white/30">{fmt(disk.used)} usados de {fmt(disk.total)}</p>
            </div>
            <span className={`ml-auto text-sm font-bold ${disk.pct >= 90 ? "text-red-400" : disk.pct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>
              {disk.pct}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${disk.pct >= 90 ? "bg-red-500" : disk.pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${disk.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/25">
            <span>{fmt(disk.used)} usado</span>
            <span>{fmt(disk.avail)} livre</span>
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(bytes: number) {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + " TB";
  if (bytes >= 1e9)  return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6)  return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}
