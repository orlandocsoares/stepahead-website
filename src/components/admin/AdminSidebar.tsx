"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, FolderOpen, Users, Calendar,
  Shield, Settings, LogOut, ChevronLeft, ChevronRight, Globe, X, UserCircle, LifeBuoy, MessageSquare, Mail, GraduationCap,
} from "lucide-react";
import { useAdminUser } from "@/hooks/useAdminUser";

// roles: undefined = todos | "admin" = admin e super-admin | "staff" = admin + formador
const NAV = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/dashboard" },
  { label: "Conteúdos",    icon: FileText,         path: "/dashboard/conteudos" },
  { label: "Ficheiros",    icon: FolderOpen,       path: "/dashboard/ficheiros" },
  { label: "Agenda",       icon: Calendar,         path: "/dashboard/agenda" },
  { label: "Comunidade",   icon: MessageSquare,    path: "/dashboard/comunidade" },
  { label: "Mensagens",    icon: Mail,             path: "/dashboard/mensagens" },
  { label: "Turmas",       icon: GraduationCap,    path: "/dashboard/turmas",       adminOnly: true },
  { label: "Utilizadores", icon: Users,            path: "/dashboard/admin",        adminOnly: true },
  { label: "Suporte",      icon: LifeBuoy,         path: "/dashboard/suporte" },
  { label: "Perfil",       icon: UserCircle,       path: "/dashboard/perfil" },
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

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : user?.email ?? "";

  const roleLabel =
    user?.role === "super-admin" ? "Super Admin"
    : user?.role === "admin" ? "Administrador"
    : user?.role === "formador" ? "Formador"
    : "Formando";

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50 flex flex-col
        bg-[#0d0d14] border-r border-white/[0.06]
        transition-all duration-300 ease-in-out
        /* Mobile: drawer oculto por defeito (-translate-x-full), abre via mobileOpen.
           Desktop (md+): sempre visível; colapsa para 68px (só ícones) via collapsed.
           Overlay + fecho automático ao navegar estão no layout.tsx. */
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        ${collapsed ? "md:w-[68px]" : "md:w-[220px]"}
        w-[220px]
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] shrink-0 ${collapsed ? "md:justify-center" : ""}`}>
        <img
          src="/logo.png"
          alt="Saber Mais"
          className={`object-contain shrink-0 transition-all duration-300 ${collapsed ? "md:h-8 md:w-8" : "h-9 w-auto max-w-[140px]"}`}
          // Logo PNG tem conteúdo escuro — invertido para branco sobre fundo #0d0d14
          style={{ filter: "brightness(0) invert(1)" }}
        />
        {/* Botão de fechar em mobile */}
        <button
          onClick={onMobileClose}
          className="ml-auto text-white/30 hover:text-white md:hidden"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="dashboard-sidebar flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV.filter(({ adminOnly }) => {
          if (!adminOnly) return true;
          return user?.role === "admin" || user?.role === "super-admin";
        }).map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              href={path}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150 relative
                ${active
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                }
                ${collapsed ? "md:justify-center" : ""}
              `}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
              )}
              <Icon size={18} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + actions */}
      <div className="border-t border-white/[0.06] p-3 space-y-1 shrink-0">
        <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? "md:hidden" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0 text-xs font-bold text-blue-400 uppercase">
            {displayName?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-white/30 truncate">{roleLabel}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title={collapsed ? "Terminar sessão" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors duration-150 ${collapsed ? "md:justify-center" : ""}`}
        >
          <LogOut size={16} strokeWidth={1.5} className="shrink-0" />
          <span className={collapsed ? "md:hidden" : ""}>Terminar sessão</span>
        </button>

        {/* Toggle collapse — apenas desktop */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir" : "Recolher"}
          className={`hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors duration-150 ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">Recolher</span></>}
        </button>
      </div>
    </aside>
  );
}
