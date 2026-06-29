"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { getSavedMode, applyMode, saveMode, MODES, type SiteMode } from "@/lib/site-mode";

type AppShellCtx = { mode: SiteMode; changeMode: (m: SiteMode) => void };
const AppShellContext = createContext<AppShellCtx>({ mode: "escuro", changeMode: () => {} });
export const useAppMode = () => useContext(AppShellContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<SiteMode>("escuro");

  const isCleanPage = pathname === "/recursos" || pathname?.startsWith("/recursos/");

  useEffect(() => {
    const saved = getSavedMode();
    setMode(saved);
    applyMode(saved);
  }, []);

  const changeMode = (newMode: SiteMode) => {
    setMode(newMode);
    saveMode(newMode);
    applyMode(newMode);
  };

  if (isCleanPage) return <>{children}</>;

  const modeConfig = MODES.find(m => m.id === mode) ?? MODES[0];

  return (
    <>
      <div className="fixed inset-0 z-0">
        <img
          src={modeConfig.thumb}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: mode === "claro"
              ? "saturate(1.1) brightness(1.05)"
              : "saturate(1.15) contrast(1.05) brightness(0.88)",
          }}
        />
        <div className={`absolute inset-0 ${modeConfig.overlay} ${modeConfig.blur} pointer-events-none transition-all duration-700`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
      </div>

      <AppShellContext.Provider value={{ mode, changeMode }}>
        {children}
      </AppShellContext.Provider>
    </>
  );
}
