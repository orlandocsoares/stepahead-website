"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { usePathname } from "next/navigation";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { ShieldAlert } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { warning, countdown, stayLoggedIn } = useInactivityLogout();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

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

      {warning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Sessão prestes a expirar</h3>
              <p className="text-sm text-white/50">Por inactividade, a sessão será encerrada em</p>
              <p className="text-3xl font-bold text-amber-400 mt-3 tabular-nums">{mm}:{ss}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => { window.location.href = "/"; }); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.06] text-sm text-white/50 hover:text-white transition-colors"
              >
                Sair agora
              </button>
              <button
                onClick={stayLoggedIn}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors"
              >
                Continuar sessão
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-[#0d0d14] flex overflow-hidden"
        style={{ backgroundImage: "url('/dashboard-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-[#0d0d14]/88 pointer-events-none" />
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
          <AdminTopbar onMobileMenuToggle={() => setMobileOpen((o) => !o)} />
          <main className="dashboard-main flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">{children}</main>
        </div>
      </div>
    </>
  );
}
