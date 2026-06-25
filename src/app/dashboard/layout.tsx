"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

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

      <div className="fixed inset-0 bg-[#0d0d14] flex overflow-hidden">
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
