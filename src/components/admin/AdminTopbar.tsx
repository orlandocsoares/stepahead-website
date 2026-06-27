"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminUser } from "@/hooks/useAdminUser";
<<<<<<< HEAD
import { Menu, MessageSquare } from "lucide-react";
=======
import { Menu, MessageSquare, Globe } from "lucide-react";
>>>>>>> d2f82045cce2d043fe5f170db18eac4eb028e879
import { useEffect, useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/conteudos":     "Conteúdos",
  "/dashboard/ficheiros":     "Ficheiros",
  "/dashboard/utilizadores":  "Utilizadores",
  "/dashboard/agenda":        "Agenda",
  "/dashboard/admin":         "Permissões",
  "/dashboard/definicoes":    "Definições",
  "/dashboard/perfil":        "Perfil",
  "/dashboard/repositorio":   "Repositório",
  "/dashboard/comunidade":    "Comunidade",
  "/dashboard/suporte":       "Suporte",
  "/dashboard/mensagens":     "Mensagens",
};

type Props = {
  onMobileMenuToggle: () => void;
};

export function AdminTopbar({ onMobileMenuToggle }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminUser();
  const [unread, setUnread] = useState(0);

  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const displayName = user?.first_name ?? user?.email?.split("@")[0] ?? "";
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  // Polling de não lidas a cada 15s
  useEffect(() => {
    if (!user) return;
    async function fetchUnread() {
      const res = await fetch("/api/mensagens?unread=1");
      const { count } = await res.json();
      setUnread(count ?? 0);
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="h-14 md:h-16 border-b border-white/[0.06] flex items-center px-4 md:px-6 shrink-0 bg-[#0d0d14] gap-3">
      {/* Hamburger — visível apenas em mobile */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 -ml-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Título: centrado em mobile, alinhado à esquerda em desktop */}
      <h1 className="flex-1 text-sm md:text-base font-semibold text-white text-center md:text-left">{title}</h1>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
<<<<<<< HEAD
=======
        {/* Voltar ao site público */}
        <a
          href="/"
          className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Ver site público"
          title="Ver site público"
        >
          <Globe size={18} />
        </a>

>>>>>>> d2f82045cce2d043fe5f170db18eac4eb028e879
        {/* Badge de mensagens não lidas */}
        <button
          onClick={() => router.push("/dashboard/mensagens")}
          className="relative p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Mensagens"
        >
          <MessageSquare size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] text-white flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-white/70">{displayName}</p>
          <p className="text-[10px] text-white/30 capitalize">{user?.role ?? ""}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 uppercase shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
}
