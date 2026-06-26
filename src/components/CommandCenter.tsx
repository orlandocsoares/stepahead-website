"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

type Props = {
  onLoginClick?: () => void;
};

// Verifica sessão via API própria (não Supabase).
// - Sem sessão: mostra o botão circular de login
// - Com sessão: mostra botão discreto para o backoffice
export function CommandCenter({ onLoginClick }: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => setLoggedIn(!!(data?.data?.user)))
      .catch(() => setLoggedIn(false));
  }, []);

  // Ainda a carregar — não mostrar nada para evitar flash
  if (loggedIn === null) return null;

  // Autenticado → botão discreto no canto inferior esquerdo
  if (loggedIn) {
    return (
      <Link
        href="/dashboard"
        title="Ir para o backoffice"
        className="fixed bottom-6 left-6 z-[110] w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 hover:bg-black/60 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      >
        <LayoutDashboard size={18} strokeWidth={1.5} />
      </Link>
    );
  }

  // Não autenticado → botão circular de login original
  return (
    <div className="fixed left-0 top-0 h-screen z-50 flex items-center pointer-events-none">
      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="ml-6 pointer-events-auto flex flex-col items-center p-4 bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_0_60px_rgba(0,0,0,0.8)]"
      >
        <div className="relative flex items-center w-full justify-center">
          <motion.button
            onClick={onLoginClick}
            className="relative w-24 h-24 rounded-full outline-none group inline-flex items-center justify-center overflow-hidden bg-white/[0.08] border border-white/10 hover:border-white/40 transition-all duration-500 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_28px_rgba(59,130,246,0.18)]"
          >
            <motion.div
              className="absolute inset-0 rounded-full border-[2px] border-transparent"
              animate={{
                borderColor: ["rgba(59,130,246,0.8)", "rgba(16,185,129,0.8)", "rgba(168,85,247,0.8)", "rgba(59,130,246,0.8)"],
                boxShadow: ["0 0 25px rgba(59,130,246,0.6)", "0 0 25px rgba(16,185,129,0.6)", "0 0 25px rgba(168,85,247,0.6)", "0 0 25px rgba(59,130,246,0.6)"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <LogIn size={26} strokeWidth={1.2} className="relative z-10 text-white/90 group-hover:text-white transition-colors duration-500 group-hover:drop-shadow-[0_0_18px_rgba(59,130,246,0.6)]" />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-slate-950/20 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.5em] text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              Entrar
            </span>
          </motion.button>
        </div>
      </motion.nav>
    </div>
  );
}
