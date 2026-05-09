"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CalendarDays, FolderOpen, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSection } from "./HeroSection"; // Importamos a Hero para ser o fundo
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS = [
    { name: "Início", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { name: "Arquivos", href: "/dashboard/repositorio", icon: FolderOpen },
    { name: "Conta", href: "/dashboard/definicoes", icon: Settings },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      
      {/* CAMADA 1: HERO SECTION ANIMADA (O FUNDO) */}
      <div className="absolute inset-0 z-0">
        <HeroSection isDashboardView={true} />
      </div>

      {/* CAMADA 2: OVERLAY DE DESFOCAGEM (BLUR) */}
      <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-black/40 pointer-events-none" />

      {/* CAMADA 3: INTERFACE DO DASHBOARD */}
      <div className="relative z-20 flex h-screen">
        
        {/* SIDEBAR RETRÁTIL */}
        <motion.aside 
          initial={false}
          animate={{ width: isCollapsed ? 80 : 260 }}
          className="h-full border-r border-white/5 bg-black/20 backdrop-blur-2xl flex flex-col transition-all duration-500 ease-in-out"
        >
          {/* Logo / Toggle */}
          <div className="h-24 flex items-center justify-between px-6 border-b border-white/5">
            {!isCollapsed && <span className="text-[10px] font-light uppercase tracking-[0.3em] text-white">Saber Mais</span>}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex-1 py-8 px-3 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  {!isCollapsed && <span className="text-[11px] font-medium uppercase tracking-widest">{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sair */}
          <div className="p-4 border-t border-white/5">
            <button 
              onClick={() => { supabase.auth.signOut(); router.push("/"); }}
              className="w-full flex items-center gap-4 px-4 py-3 text-white/20 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} strokeWidth={1} />
              {!isCollapsed && <span className="text-[11px] font-medium uppercase tracking-widest">Sair</span>}
            </button>
          </div>
        </motion.aside>

        {/* CONTEÚDO PRINCIPAL (SCROLLÁVEL) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-8 md:p-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}