"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Calendar, FileText, 
  User, LogOut, ShieldAlert, ChevronRight 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";

export function CommandCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { label: "Radar", icon: BarChart3, path: "/dashboard", color: "text-blue-400" },
    { label: "Agenda", icon: Calendar, path: "/dashboard/agenda", color: "text-emerald-400" },
    { label: "Repositório", icon: FileText, path: "/dashboard/repositorio", color: "text-amber-400" },
    { label: "Perfil", icon: User, path: "/dashboard/perfil", color: "text-purple-400" },
  ];

  if (profile?.role === 'super-admin') {
    navItems.push({ label: "Controlo", icon: ShieldAlert, path: "/dashboard/admin", color: "text-red-500" });
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // A CORRECÇÃO: Forçar a limpeza da rota para o Next.js não encravar ao voltar para a Hero
    window.location.href = '/';
  };

  if (loading) return null;

  return (
    <div 
      className="fixed left-0 top-0 h-screen z-[100] flex items-center pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.nav 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="ml-6 pointer-events-auto flex flex-col items-center gap-4 p-4 bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_0_60px_rgba(0,0,0,0.8)]"
      >
        <div className="flex flex-col gap-3">
          {navItems.map((item, index) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <div key={item.path} className="relative flex items-center">
                <button
                  onClick={() => router.push(item.path)}
                  className={`relative p-4 rounded-full transition-all duration-700 group ${isActive ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.03]'}`}
                >
                  <Icon size={22} className={`relative z-10 transition-all ${isActive ? item.color : 'text-white/20 group-hover:text-white'}`} />
                  {isActive && <motion.div layoutId="glow" className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl" />}
                </button>

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 15 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="absolute left-full pointer-events-none"
                    >
                      <div className="px-6 py-3 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl whitespace-nowrap shadow-2xl">
                        <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${isActive ? 'text-white' : 'text-white/40'}`}>
                          {item.label}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="w-10 h-[1px] bg-white/5 my-4" />

        <button onClick={handleLogout} className="p-4 rounded-full text-white/10 hover:text-red-500 hover:bg-red-500/5 transition-all group relative">
          <LogOut size={20} />
          <AnimatePresence>{isHovered && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 15 }} className="absolute left-full px-6 py-3 bg-red-500/10 backdrop-blur-3xl border border-red-500/20 rounded-2xl whitespace-nowrap shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500">Sair</span>
            </motion.div>
          )}</AnimatePresence>
        </button>
      </motion.nav>

      {!isHovered && (
        <motion.div animate={{ x: [0, 8, 0], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} className="ml-2 text-blue-500/50">
          <ChevronRight size={20} strokeWidth={1} />
        </motion.div>
      )}
    </div>
  );
}