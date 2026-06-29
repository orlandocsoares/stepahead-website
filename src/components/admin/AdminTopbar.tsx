"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Menu, MessageSquare, Globe, Bell, CheckCheck, UserCheck, AlertTriangle, ArrowRight, X, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/ficheiros":     "Ficheiros",
  "/dashboard/utilizadores":  "Utilizadores",
  "/dashboard/agenda":        "Agenda",
  "/dashboard/admin":         "Utilizadores",
  "/dashboard/definicoes":    "Definições",
  "/dashboard/perfil":        "Perfil",
  "/dashboard/repositorio":   "Repositório",
  "/dashboard/comunidade":    "Comunidade",
  "/dashboard/suporte":       "Suporte",
  "/dashboard/mensagens":     "Mensagens",
  "/dashboard/turmas":        "Turmas",
};

type Props = { onMobileMenuToggle: () => void };

export function AdminTopbar({ onMobileMenuToggle }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminUser();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const displayName = user?.first_name ?? user?.email?.split("@")[0] ?? "";
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notificacoes");
      if (!res.ok) return;
      const { notificacoes, unread: u } = await res.json();
      setNotifs(notificacoes ?? []);
      setUnread(u ?? 0);
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
    setUnread(0);
  }

  async function markRead(id: string, link?: string) {
    await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    if (link) { setNotifOpen(false); router.push(link); }
  }

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const i = setInterval(fetchNotifs, 20000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/mensagens?unread=1").then(r => r.json()).then(d => setMsgUnread(d.count ?? 0)).catch(() => {});
    const i = setInterval(() => {
      fetch("/api/mensagens?unread=1").then(r => r.json()).then(d => setMsgUnread(d.count ?? 0)).catch(() => {});
    }, 15000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => { setBannerDismissed(false); }, [pathname]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "agora";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const pendingFormandos = notifs.filter(n => n.tipo === "novo_formando" && !n.lida);
  const pendingFormadores = notifs.filter(n => n.tipo === "novo_formador" && !n.lida);
  const totalPending = pendingFormandos.length + (isAdmin ? pendingFormadores.length : 0);
  const showBanner = totalPending > 0 && !bannerDismissed && pathname !== "/dashboard/admin";

  return (
    <>
    {showBanner && (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-3">
        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
        <p className="text-xs text-amber-200 flex-1">
          {pendingFormandos.length > 0 && (
            <><span className="font-semibold">{pendingFormandos.length} formando{pendingFormandos.length > 1 ? "s" : ""}</span>{pendingFormandos.length > 1 ? " aguardam" : " aguarda"} aprovação. </>
          )}
          {isAdmin && pendingFormadores.length > 0 && (
            <><span className="font-semibold">{pendingFormadores.length} formador{pendingFormadores.length > 1 ? "es" : ""}</span>{pendingFormadores.length > 1 ? " aguardam" : " aguarda"} validação.</>
          )}
        </p>
        <button
          onClick={() => { setBannerDismissed(false); router.push("/dashboard/admin"); }}
          className="flex items-center gap-1 text-[11px] text-amber-400 font-medium hover:text-amber-300 transition-colors shrink-0"
        >
          Ver agora <ArrowRight size={12} />
        </button>
        <button onClick={() => setBannerDismissed(true)} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    )}
    <header className="h-14 md:h-16 border-b border-white/[0.06] flex items-center px-4 md:px-6 shrink-0 bg-[#0d0d14] gap-3">
      <button onClick={onMobileMenuToggle} className="md:hidden p-2 -ml-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0" aria-label="Abrir menu">
        <Menu size={20} />
      </button>

      <h1 className="flex-1 text-sm md:text-base font-semibold text-white text-center md:text-left">{title}</h1>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <a href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-all text-[10px] font-bold uppercase tracking-[0.2em]" title="Ver site público">
          <Globe size={12} />
          <span className="hidden sm:inline">Site</span>
        </a>

        <button onClick={() => router.push("/dashboard/mensagens")} className="relative p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors">
          <MessageSquare size={18} />
          {msgUnread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] text-white flex items-center justify-center font-bold">
              {msgUnread > 9 ? "9+" : msgUnread}
            </span>
          )}
        </button>

        {/* Notificações */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) fetchNotifs(); }}
            className="relative p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-[#13131f] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white">Notificações</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors">
                    <CheckCheck size={12} /> Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="mx-auto text-white/10 mb-2" />
                    <p className="text-xs text-white/30">Sem notificações</p>
                  </div>
                ) : notifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id, n.link)}
                    className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors flex gap-3 ${!n.lida ? "bg-blue-500/5" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.tipo === "novo_formando" ? "bg-emerald-500/10" :
                      n.tipo === "novo_formador" ? "bg-amber-500/10" :
                      "bg-blue-500/10"
                    }`}>
                      {n.tipo === "novo_formando" ? <UserCheck size={14} className="text-emerald-400" /> :
                       n.tipo === "novo_formador" ? <ShieldCheck size={14} className="text-amber-400" /> :
                       <Bell size={14} className="text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-medium leading-tight ${!n.lida ? "text-white" : "text-white/60"}`}>{n.titulo}</p>
                        <span className="text-[10px] text-white/25 shrink-0">{timeAgo(n.created_at)}</span>
                      </div>
                      {n.mensagem && <p className="text-[11px] text-white/40 mt-0.5 leading-tight line-clamp-2">{n.mensagem}</p>}
                      {!n.lida && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar com dropdown de logout */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen(o => !o)}
            className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 uppercase shrink-0 hover:bg-blue-600/50 transition-colors"
          >
            {initial}
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-10 w-48 bg-[#13131f] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-white/30 capitalize">{user?.role ?? ""}</p>
              </div>
              <button
                onClick={() => { setAvatarOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
              >
                <LogOut size={15} />
                Terminar sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
