"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

// Botão fixo no canto inferior esquerdo — só aparece quando há sessão activa.
// Leva o utilizador directamente para o backoffice sem terminar sessão.
export function CommandCenter() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setLoggedIn(true); })
      .catch(() => {});
  }, []);

  if (!loggedIn) return null;

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
