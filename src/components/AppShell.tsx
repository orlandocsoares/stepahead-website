"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSavedBrightness, applyBrightness } from "@/lib/brightness";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isCleanPage = pathname === "/recursos" || pathname?.startsWith("/recursos/");

  // Aplicar luminosidade guardada ao carregar
  useEffect(() => {
    applyBrightness(getSavedBrightness());
  }, []);

  if (isCleanPage) return <>{children}</>;

  return (
    <>
      <div className="fixed inset-0 z-0">
        {/* Imagem de fundo fixa */}
        <img
          src="/modos/escuro.webp"
          alt=""
          className="w-full h-full object-cover saturate-110 contrast-105"
        />
        {/* Overlay controlado pelo slider — opacidade via CSS var */}
        <div
          className="absolute inset-0 pointer-events-none transition-[background-color] duration-300"
          style={{ backgroundColor: "rgba(0,0,0,var(--brightness-overlay,0.38))" }}
        />
        {/* Gradiente fixo de rodapé */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>
      {children}
    </>
  );
}
