"use client";

import { usePathname } from "next/navigation";
import { HelpCircle, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { DASHBOARD_URL } from "@/lib/program-config";

const MENU_ITEMS = [
  { href: "/saber-mais", label: "Saber Mais" },
  { href: "/provincias", label: "Províncias" },
  { href: "/formadores", label: "Formadores" },
  { href: "/recursos", label: "Recursos" },
  { href: "/eventos", label: "Eventos" },
  { href: "/agenda-publica", label: "Agenda" },
];

export function PublicSideMenu() {
  const pathname = usePathname();
  const activeIndex = MENU_ITEMS.findIndex((item) => item.href === pathname);

  const prevHref = MENU_ITEMS[(activeIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length]?.href ?? MENU_ITEMS[0].href;
  const nextHref = MENU_ITEMS[(activeIndex + 1) % MENU_ITEMS.length]?.href ?? MENU_ITEMS[0].href;

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <a
          href={DASHBOARD_URL}
          className="flex-1 flex items-center justify-center gap-2 border border-white/15 rounded-lg px-3 py-2 text-sm text-white/80 hover:border-white/40 hover:text-white transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </a>
        <a
          href="/ajuda"
          title="Ajuda"
          className="w-9 h-9 shrink-0 flex items-center justify-center border border-white/15 rounded-full text-white/80 hover:border-white/40 hover:text-white transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </a>
      </div>

      <nav className="flex flex-col gap-2">
        {MENU_ITEMS.map((item) => {
          const active = item.href === pathname;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-lg border px-4 py-2.5 text-sm text-center transition-colors ${
                active
                  ? "bg-white text-black border-white font-semibold"
                  : "border-white/15 text-white/80 hover:border-white/40 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border border-white/15 rounded-lg px-3 py-2">
        <a href={prevHref} className="text-white/60 hover:text-white transition-colors" title="Anterior">
          <ChevronLeft className="h-4 w-4" />
        </a>
        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
        <a href={nextHref} className="text-white/60 hover:text-white transition-colors" title="Seguinte">
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </aside>
  );
}
