"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Users, Calendar,
  Shield, LogOut, ChevronLeft, ChevronRight, Globe, X, UserCircle, LifeBuoy,
  MessageSquare, Mail, GraduationCap, ClipboardList, BookOpen, ChevronDown, UserPlus, HelpCircle, Bell,
} from "lucide-react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useState, useEffect } from "react";

const NAV_TOP = [
  { label: "Dashboard",  icon: LayoutDashboard, path: "/dashboard", hideForFormando: true },
];

const NAV_GERAL = [
  { label: "Agenda",         icon: Calendar,      path: "/dashboard/agenda" },
  { label: "Comunidade",     icon: MessageSquare, path: "/dashboard/comunidade" },
  { label: "Mensagens",      icon: Mail,          path: "/dashboard/mensagens" },
  { label: "Notificações",   icon: Bell,          path: "/dashboard/notificacoes" },
];

const NAV_ACADEMICA = [
  { label: "As Minhas Formações", icon: BookOpen, path: "/dashboard/minhas-formacoes" },
  { label: "Repositório",  icon: FolderOpen,    path: "/dashboard/ficheiros" },
  { label: "Tarefas",      icon: ClipboardList, path: "/dashboard/tarefas" },
  { label: "Acções de Formação", icon: GraduationCap, path: "/dashboard/acoes-formacao", staffOnly: true },
  { label: "Formandos por Validar", icon: UserPlus, path: "/dashboard/formandos-por-validar", staffOnly: true },
];

const NAV_BOTTOM = [
  { label: "Utilizadores", icon: Users,       path: "/dashboard/admin",       staffOnly: true },
  { label: "Suporte",      icon: LifeBuoy,    path: "/dashboard/suporte" },
  { label: "Manual",       icon: HelpCircle,  path: "/dashboard/manual" },
  { label: "Perfil",       icon: UserCircle,  path: "/dashboard/perfil" },
  { label: "Audit Log",    icon: Shield,      path: "/dashboard/admin/audit", adminOnly: true },
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const { user, logout } = useAdminUser();
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains("light"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const academicaPaths = NAV_ACADEMICA.map(i => i.path);
  const academicaActive = academicaPaths.some(p => pathname.startsWith(p));
  const [academicaOpen, setAcademicaOpen] = useState(academicaActive);

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  const canSee = (item: any) => {
    if (item.adminOnly) return user?.role === "admin" || user?.role === "super-admin";
    if (item.staffOnly) return user?.role === "admin" || user?.role === "super-admin" || user?.role === "formador";
    // Formando entra directamente em "As Minhas Formações" — a Dashboard genérica
    // deixou de fazer sentido como ponto de entrada duplicado.
    if (item.hideForFormando) return user?.role !== "formando";
    return true;
  };

  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : user?.email ?? "";

  const roleLabel =
    user?.role === "super-admin" ? "Super Admin"
    : user?.role === "admin" ? "Administrador"
    : user?.role === "formador" ? "Formador"
    : "Formando";

  const NavLink = ({ label, icon: Icon, path }: { label: string; icon: any; path: string }) => {
    const active = isActive(path);
    return (
      <Link href={path} title={collapsed ? label : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative
          ${active ? "bg-blue-600/20 text-blue-400" : "c-tx3 hc-tx2 hc-s1"}
          ${collapsed ? "md:justify-center" : ""}`}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />}
        <Icon size={18} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
        <span className={collapsed ? "md:hidden" : ""}>{label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50 flex flex-col c-bg border-r c-br
        transition-all duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        ${collapsed ? "md:w-[68px]" : "md:w-[220px]"}
        w-[220px]
      `}
      style={isLight ? { background: "rgba(190,215,240,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "rgba(140,185,230,0.45)" } : {}}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b c-br shrink-0 ${collapsed ? "md:justify-center" : ""}`}>
        <img src="/logo.png" alt="Saber Mais"
          className={`theme-logo object-contain shrink-0 transition-all duration-300 ${collapsed ? "md:h-8 md:w-8" : "h-9 w-auto max-w-[140px]"}`} />
        <button onClick={onMobileClose} className="ml-auto c-tx4 hc-tx md:hidden" aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="dashboard-sidebar flex-1 overflow-y-auto py-4 px-2 space-y-1 min-h-0">

        {/* Dashboard */}
        {NAV_TOP.map(item => <NavLink key={item.path} {...item} />)}

        {/* Grupo Área Académica */}
        <div className="pt-1">
          <button
            onClick={() => setAcademicaOpen(o => !o)}
            title={collapsed ? "Área Académica" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors
              ${academicaActive ? "text-blue-400" : "c-tx5 hc-tx3"}
              ${collapsed ? "md:justify-center" : ""}`}>
            <BookOpen size={15} strokeWidth={1.8} className="shrink-0" />
            <span className={`flex-1 text-left ${collapsed ? "md:hidden" : ""}`}>Área Académica</span>
            {!collapsed && <ChevronDown size={13} className={`transition-transform duration-200 ${academicaOpen ? "rotate-180" : ""}`} />}
          </button>

          {(academicaOpen || collapsed) && (
            <div className={`mt-1 space-y-1 ${collapsed ? "" : "pl-3 border-l border-white/[0.06] ml-3"}`}>
              {NAV_ACADEMICA.filter(canSee).map(item => <NavLink key={item.path} {...item} />)}
            </div>
          )}
        </div>

        {/* Links gerais */}
        <div className="pt-1 space-y-1">
          {NAV_GERAL.map(item => <NavLink key={item.path} {...item} />)}
        </div>

        {/* Links de fundo */}
        <div className="pt-1 space-y-1">
          {NAV_BOTTOM.filter(canSee).map(item => <NavLink key={item.path} {...item} />)}
        </div>
      </nav>

      {/* User + actions */}
      <div className="border-t c-br p-3 space-y-1 shrink-0">
        <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? "md:hidden" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0 text-xs font-bold text-blue-400 uppercase overflow-hidden">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={displayName?.[0] ?? "?"} className="w-full h-full object-cover" />
              : (displayName?.[0] ?? "?")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold c-tx truncate">{displayName}</p>
            <p className="text-[10px] c-tx4 truncate">{roleLabel}</p>
          </div>
        </div>

        <button onClick={logout} title={collapsed ? "Terminar sessão" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm c-tx4 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors duration-150 ${collapsed ? "md:justify-center" : ""}`}>
          <LogOut size={16} strokeWidth={1.5} className="shrink-0" />
          <span className={collapsed ? "md:hidden" : ""}>Terminar sessão</span>
        </button>

        <button onClick={onToggle} title={collapsed ? "Expandir" : "Recolher"}
          className={`hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm c-tx5 hover:c-tx3 hc-s1 transition-colors duration-150 ${collapsed ? "justify-center" : ""}`}>
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">Recolher</span></>}
        </button>
      </div>
    </aside>
  );
}
