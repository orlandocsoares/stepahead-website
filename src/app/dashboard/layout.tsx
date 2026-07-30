"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { usePathname } from "next/navigation";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useAdminUser } from "@/hooks/useAdminUser";
import { ShieldAlert, Key, Loader2, Eye, EyeOff } from "lucide-react";
import { DashboardTour, shouldShowDashboardTour } from "@/components/dashboard/DashboardTour";

function ForcarTrocaPasswordModal() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("A password deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As passwords não coincidem."); return; }
    setSaving(true);
    const res = await fetch("/api/auth/update-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok || json.error) { setError(json.error?.message ?? "Erro ao actualizar password."); setSaving(false); return; }
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative c-bg border c-br rounded-2xl p-8 max-w-sm w-full space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Key size={22} className="text-amber-400" />
          </div>
          <h3 className="text-base font-semibold c-tx">Define a tua password</h3>
          <p className="text-sm c-tx3">A tua conta foi criada com uma password temporária. Define uma nova antes de continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Nova password (mín. 6)" autoFocus
              className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 pr-9 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors" />
            <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 c-tx5 hover:c-tx3 transition-colors">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <input type={show ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmar password"
            className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Guardar e continuar
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const pathname = usePathname();
  const { warning, countdown, stayLoggedIn } = useInactivityLogout();
  const { user } = useAdminUser();
  useHeartbeat();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowDashboardTour(pathname)) setTourActive(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleStartTour = useCallback(() => setTourActive(true), []);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <>
      {/*
        Scrollbar oculta apenas no dashboard — não usar globals.css para não
        afectar o site público (que tem a sua própria scrollbar estilizada).
      */}
      <style>{`
        .dashboard-main::-webkit-scrollbar { display: none !important; }
        .dashboard-main { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .dashboard-sidebar::-webkit-scrollbar { display: none !important; }
        .dashboard-sidebar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      {user?.must_change_password && <ForcarTrocaPasswordModal />}

      {warning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative c-bg border c-br rounded-2xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold c-tx mb-1">Sessão prestes a expirar</h3>
              <p className="text-sm c-tx3">Por inactividade, a sessão será encerrada em</p>
              <p className="text-3xl font-bold text-amber-400 mt-3 tabular-nums">{mm}:{ss}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => { window.location.href = "/"; }); }}
                className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors"
              >
                Sair agora
              </button>
              <button
                onClick={stayLoggedIn}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors"
              >
                Continuar sessão
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-[#0d0d14] flex overflow-hidden dashboard-root"
        style={{ backgroundImage: "var(--dash-bg-image)", backgroundSize: "cover", backgroundPosition: "center" }}>
        {/* Gradiente só no topo para legibilidade do texto — sem overlay a écran completo */}
        <div className="absolute inset-0 pointer-events-none dashboard-overlay"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.30) 18%, transparent 38%)" }} />
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <AdminSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            collapsed ? "md:ml-[68px]" : "md:ml-[220px]"
          }`}
        >
          <AdminTopbar onMobileMenuToggle={() => setMobileOpen((o) => !o)} onStartTour={handleStartTour} />
          <DashboardTour start={tourActive} onDone={() => setTourActive(false)} />
          <main className="dashboard-main flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">{children}</main>
        </div>
      </div>
    </>
  );
}
