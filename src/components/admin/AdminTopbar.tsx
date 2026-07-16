"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Menu, MessageSquare, Globe, Bell, CheckCheck, UserCheck, AlertTriangle, ArrowRight, X, LogOut, ShieldCheck, Megaphone, ClipboardList, User, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { BrightnessSlider } from "@/components/BrightnessSlider";

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
  "/dashboard/acoes-formacao": "Acções de Formação",
  "/dashboard/formandos-por-validar": "Formandos por Validar",
  "/dashboard/tarefas":       "Tarefas",
  "/dashboard/config":        "Configurações",
  "/dashboard/admin/audit":   "Audit Log",
};

type Props = { onMobileMenuToggle: () => void; onStartTour?: () => void };

export function AdminTopbar({ onMobileMenuToggle, onStartTour }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminUser();
  const [isLight, setIsLight] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [msgUnread, setMsgUnread] = useState(0);
  const [firstSenderId, setFirstSenderId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [msgOpen, setMsgOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [pendingFormandosCount, setPendingFormandosCount] = useState(0);
  const [pendingFormadoresCount, setPendingFormadoresCount] = useState(0);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const bellDropdownRef = useRef<HTMLDivElement>(null);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const msgDropdownRef = useRef<HTMLDivElement>(null);
  const [bellPos, setBellPos] = useState({ top: 0, right: 0 });
  const [avatarPos, setAvatarPos] = useState({ top: 0, right: 0 });
  const [msgPos, setMsgPos] = useState({ top: 0, right: 0 });
  const [dropdownWidth, setDropdownWidth] = useState(420);
  const [dropdownHeight, setDropdownHeight] = useState(420);
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number; which: "bell" | "msg" } | null>(null);

  const startResize = (e: React.MouseEvent, which: "bell" | "msg") => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: dropdownWidth, startH: dropdownHeight, which };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dw = dragRef.current.startX - ev.clientX; // arrastar para esquerda aumenta largura
      const dh = ev.clientY - dragRef.current.startY;
      setDropdownWidth(Math.max(300, Math.min(780, dragRef.current.startW + dw)));
      setDropdownHeight(Math.max(200, Math.min(window.innerHeight * 0.85, dragRef.current.startH + dh)));
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "";
  const roleLabel = user?.role === "super-admin" ? "Super Administrador" : user?.role === "admin" ? "Administrador" : user?.role === "formador" ? "Formador" : user?.role === "formando" ? "Formando" : user?.role ?? "";
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

  // Contagem "ao vivo" de quem está à espera — ao contrário das notificações (que
  // desaparecem assim que alguém as marca como lidas), isto reflecte sempre o estado
  // real da fila, por isso o aviso reaparece a qualquer formador/admin enquanto
  // houver alguém por aprovar, mesmo que outra pessoa já tenha "visto" a notificação.
  async function fetchPendingCounts() {
    try {
      const isStaff = user?.role === "admin" || user?.role === "super-admin" || user?.role === "formador";
      if (!isStaff) return;
      const isAdminUser = user?.role === "admin" || user?.role === "super-admin";
      const [formandosRes, formadoresRes] = await Promise.all([
        fetch("/api/formandos-pendentes").then(r => r.ok ? r.json() : { formandos: [] }).catch(() => ({ formandos: [] })),
        isAdminUser
          ? fetch("/api/formadores-pendentes").then(r => r.ok ? r.json() : { formadores: [] }).catch(() => ({ formadores: [] }))
          : Promise.resolve({ formadores: [] }),
      ]);
      setPendingFormandosCount((formandosRes.formandos ?? []).length);
      setPendingFormadoresCount((formadoresRes.formadores ?? []).length);
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

  async function clearNotifs() {
    if (!confirm("Limpar todas as notificações?")) return;
    await fetch("/api/notificacoes", { method: "DELETE" });
    setNotifs([]);
    setUnread(0);
  }

  async function fetchConversations() {
    try {
      const res = await fetch("/api/mensagens?conversations=1");
      if (!res.ok) return;
      const { data } = await res.json();
      setConversations(data ?? []);
    } catch {}
  }

  async function clearMensagensLista() {
    await fetch("/api/mensagens", { method: "PATCH" });
    setConversations(prev => prev.map(c => ({ ...c, unread_count: 0 })));
    setMsgUnread(0);
  }

  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains("light"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const i = setInterval(fetchNotifs, 20000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchPendingCounts();
    const i = setInterval(fetchPendingCounts, 20000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/mensagens?unread=1").then(r => r.json()).then(d => { setMsgUnread(d.count ?? 0); setFirstSenderId(d.first_sender_id ?? null); }).catch(() => {});
    const i = setInterval(() => {
      fetch("/api/mensagens?unread=1").then(r => r.json()).then(d => { setMsgUnread(d.count ?? 0); setFirstSenderId(d.first_sender_id ?? null); }).catch(() => {});
    }, 15000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => { setBannerDismissed(false); }, [pathname]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (bellRef.current && !bellRef.current.contains(t) && !bellDropdownRef.current?.contains(t)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(t) && !avatarDropdownRef.current?.contains(t)) setAvatarOpen(false);
      if (msgRef.current && !msgRef.current.contains(t) && !msgDropdownRef.current?.contains(t)) setMsgOpen(false);
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
  const totalPending = pendingFormandosCount + (isAdmin ? pendingFormadoresCount : 0);
  const showBanner = totalPending > 0 && !bannerDismissed && pathname !== "/dashboard/formandos-por-validar" && pathname !== "/dashboard/admin";

  return (
    <>
    {showBanner && (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-3">
        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
        <p className="text-xs text-amber-200 flex-1">
          {pendingFormandosCount > 0 && (
            <><span className="font-semibold">{pendingFormandosCount} formando{pendingFormandosCount > 1 ? "s" : ""}</span>{pendingFormandosCount > 1 ? " aguardam" : " aguarda"} aprovação. </>
          )}
          {isAdmin && pendingFormadoresCount > 0 && (
            <><span className="font-semibold">{pendingFormadoresCount} formador{pendingFormadoresCount > 1 ? "es" : ""}</span>{pendingFormadoresCount > 1 ? " aguardam" : " aguarda"} validação.</>
          )}
        </p>
        <button
          onClick={() => { setBannerDismissed(false); router.push(pendingFormandosCount > 0 ? "/dashboard/formandos-por-validar" : "/dashboard/admin"); }}
          className="flex items-center gap-1 text-[11px] text-amber-400 font-medium hover:text-amber-300 transition-colors shrink-0"
        >
          Ver agora <ArrowRight size={12} />
        </button>
        <button onClick={() => setBannerDismissed(true)} className="c-tx5 hover:c-tx4 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    )}
    <header
      className="h-14 md:h-16 border-b c-br flex items-center px-4 md:px-6 shrink-0 c-bg gap-3"
      style={isLight ? { background: "rgba(200,222,244,0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "rgba(140,185,230,0.40)" } : {}}
    >
      <button onClick={onMobileMenuToggle} className="md:hidden p-2 -ml-1 rounded-lg c-tx4 hc-tx hc-s2 transition-colors shrink-0" aria-label="Abrir menu">
        <Menu size={20} />
      </button>

      <h1 className="flex-1 text-sm md:text-base font-semibold c-tx text-center md:text-left">{title}</h1>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <BrightnessSlider />

        {onStartTour && (
          <button
            onClick={onStartTour}
            title="Ajuda — tour desta página"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border c-br c-tx4 hc-tx hc-s2 transition-colors text-sm font-black"
          >
            ?
          </button>
        )}

        <a href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border c-br c-tx4 hc-tx hc-br2 hc-s2 transition-all text-[10px] font-bold uppercase tracking-[0.2em]" title="Ver site público">
          <Globe size={12} />
          <span className="hidden sm:inline">Site</span>
        </a>

        {/* Mensagens */}
        <div ref={msgRef} className="relative">
          <button
            onClick={() => {
              if (!msgOpen && msgRef.current) {
                const r = msgRef.current.getBoundingClientRect();
                setMsgPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
              }
              setMsgOpen(o => !o);
              if (!msgOpen) fetchConversations();
            }}
            className="relative p-2 rounded-lg c-tx4 hc-tx hc-s2 transition-colors"
          >
            <MessageSquare size={18} />
            {msgUnread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] c-tx flex items-center justify-center font-bold">
                {msgUnread > 9 ? "9+" : msgUnread}
              </span>
            )}
          </button>

          {msgOpen && typeof document !== "undefined" && createPortal(
            <div ref={msgDropdownRef} className="fixed c-bg2 c-br border rounded-xl shadow-2xl z-[9999] flex flex-col overflow-hidden" style={{ top: msgPos.top, right: msgPos.right, width: dropdownWidth, height: dropdownHeight }}>
              {/* Handle de arrasto — barra no fundo à esquerda */}
              <div onMouseDown={e => startResize(e, "msg")} className="absolute bottom-0 left-0 right-0 h-5 cursor-s-resize z-50 flex items-center justify-center gap-1 opacity-40 hover:opacity-100 transition-opacity group" title="Arrastar para redimensionar">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-5 h-[3px] rounded-full bg-current c-tx4 group-hover:bg-blue-400 transition-colors" />)}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 border-b c-br">
                <span className="text-sm font-semibold c-tx">Mensagens</span>
                {msgUnread > 0 && (
                  <button onClick={clearMensagensLista} className="flex items-center gap-1 text-xs c-tx4 hc-tx transition-colors">
                    <CheckCheck size={13} /> Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {conversations.length === 0 ? (
                  <div className="py-10 text-center">
                    <MessageSquare size={28} className="mx-auto c-tx5 mb-2" />
                    <p className="text-sm c-tx4">Sem conversas</p>
                  </div>
                ) : conversations.map(c => {
                  const unreadC = Number(c.unread_count ?? 0);
                  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Utilizador";
                  return (
                    <div
                      key={c.other_id}
                      onClick={() => { setMsgOpen(false); router.push(`/dashboard/mensagens?with=${c.other_id}`); }}
                      className={`w-full text-left px-5 py-3.5 border-b c-br hc-s2 transition-colors cursor-pointer flex gap-3.5 ${unreadC > 0 ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-sm text-blue-400 font-bold uppercase shrink-0">
                        {name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight truncate ${unreadC > 0 ? "font-semibold c-tx" : "font-medium c-tx3"}`}>{name}</p>
                          <span className={`text-xs shrink-0 ${unreadC > 0 ? "text-blue-400" : "c-tx5"}`}>{timeAgo(c.created_at)}</span>
                        </div>
                        <p className={`text-xs mt-1 truncate ${unreadC > 0 ? "c-tx3" : "c-tx5"}`}>{c.last_message}</p>
                      </div>
                      {unreadC > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-[10px] c-tx flex items-center justify-center font-bold shrink-0 self-center">
                          {unreadC > 9 ? "9+" : unreadC}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          , document.body)}
        </div>

        {/* Notificações */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => {
              if (!notifOpen && bellRef.current) {
                const r = bellRef.current.getBoundingClientRect();
                setBellPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
              }
              setNotifOpen(o => !o);
              if (!notifOpen) fetchNotifs();
            }}
            className="relative p-2 rounded-lg c-tx4 hc-tx hc-s2 transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] c-tx flex items-center justify-center font-bold animate-pulse">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {notifOpen && typeof document !== "undefined" && createPortal(
            <div ref={bellDropdownRef} className="fixed c-bg2 c-br border rounded-xl shadow-2xl z-[9999] flex flex-col overflow-hidden" style={{ top: bellPos.top, right: bellPos.right, width: dropdownWidth, height: dropdownHeight }}>
              {/* Handle de arrasto — barra no fundo */}
              <div onMouseDown={e => startResize(e, "bell")} className="absolute bottom-0 left-0 right-0 h-5 cursor-s-resize z-50 flex items-center justify-center gap-1 opacity-40 hover:opacity-100 transition-opacity group" title="Arrastar para redimensionar">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-5 h-[3px] rounded-full bg-current c-tx4 group-hover:bg-blue-400 transition-colors" />)}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 border-b c-br">
                <span className="text-sm font-semibold c-tx">Notificações</span>
                <div className="flex items-center gap-3">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs c-tx4 hc-tx transition-colors">
                      <CheckCheck size={13} /> Marcar lidas
                    </button>
                  )}
                  {notifs.length > 0 && (
                    <button onClick={clearNotifs} className="flex items-center gap-1 text-xs c-tx5 hover:text-red-400 transition-colors">
                      <Trash2 size={13} /> Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {notifs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={28} className="mx-auto c-tx5 mb-2" />
                    <p className="text-sm c-tx4">Sem notificações</p>
                  </div>
                ) : notifs.map(n => {
                  const isExpanded = expandedId === n.id;
                  const iconBg = n.tipo === "novo_formando" ? "bg-emerald-500/10" : n.tipo === "novo_formador" ? "bg-amber-500/10" : n.tipo === "anuncio" ? "bg-purple-500/10" : "bg-blue-500/10";
                  const icon = n.tipo === "novo_formando" ? <UserCheck size={16} className="text-emerald-400" /> : n.tipo === "novo_formador" ? <ShieldCheck size={16} className="text-amber-400" /> : n.tipo === "anuncio" ? <Megaphone size={16} className="text-purple-400" /> : n.tipo === "tarefa" ? <ClipboardList size={16} className="text-blue-400" /> : <Bell size={16} className="text-blue-400" />;
                  const destino = n.link ?? (
                    n.tipo === "novo_formando" || n.tipo === "novo_formador" ? "/dashboard/admin" :
                    n.tipo === "tarefa" ? "/dashboard/tarefas" :
                    n.tipo === "anuncio" ? null : null
                  );
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (destino) { setNotifOpen(false); router.push(destino); return; }
                        setExpandedId(isExpanded ? null : n.id);
                      }}
                      className={`w-full text-left px-5 py-4 border-b c-br hc-s2 transition-colors cursor-pointer ${!n.lida ? "bg-blue-500/5" : ""}`}
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
                            <span className="text-xs text-blue-400 mt-1.5 inline-block font-medium">
                              Abrir →
                            </span>
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
          , document.body)}
        </div>

        {/* Avatar com dropdown de logout */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => {
              if (!avatarOpen && avatarRef.current) {
                const r = avatarRef.current.getBoundingClientRect();
                setAvatarPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
              }
              setAvatarOpen(o => !o);
            }}
            className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 uppercase shrink-0 hover:bg-blue-600/50 transition-colors overflow-hidden"
          >
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={initial} className="w-full h-full object-cover" />
              : initial}
          </button>

          {avatarOpen && typeof document !== "undefined" && createPortal(
            <div ref={avatarDropdownRef} className="fixed w-52 c-bg2 c-br border rounded-xl shadow-2xl z-[9999] overflow-hidden" style={{ top: avatarPos.top, right: avatarPos.right }}>
              <div className="px-4 py-3 border-b c-br">
                <p className="text-xs font-semibold c-tx truncate">{displayName}</p>
                <p className="text-[10px] c-tx4">{roleLabel}</p>
              </div>
              <button
                onClick={() => { setAvatarOpen(false); router.push("/dashboard/perfil"); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm c-tx3 hover:c-tx hc-s2 transition-colors"
              >
                <User size={15} />
                Ver perfil
              </button>
              {/* Logout só visível em mobile — em desktop está na sidebar */}
              <button
                onClick={() => { setAvatarOpen(false); logout(); }}
                className="md:hidden w-full flex items-center gap-2 px-4 py-3 text-sm c-tx3 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors border-t c-br"
              >
                <LogOut size={15} />
                Terminar sessão
              </button>
            </div>
          , document.body)}
        </div>
      </div>
    </header>
    </>
  );
}
