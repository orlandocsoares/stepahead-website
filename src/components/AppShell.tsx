"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getSavedMode, applyMode, saveMode, MODES, type SiteMode } from "@/lib/site-mode";

type AppShellCtx = { mode: SiteMode; changeMode: (m: SiteMode) => void };
const AppShellContext = createContext<AppShellCtx>({ mode: "escuro", changeMode: () => {} });
export const useAppMode = () => useContext(AppShellContext);

const ANIMATED_ROUTES = ["/preview"];

function PageTransition({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  if (!ANIMATED_ROUTES.includes(pathname)) return <>{children}</>;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, filter: "blur(20px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(20px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="contents"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

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

  const modeConfig = MODES.find(m => m.id === mode) ?? MODES[0];

  if (isCleanPage) {
    return (
      <AppShellContext.Provider value={{ mode, changeMode }}>
        <PageTransition pathname={pathname ?? ""}>{children}</PageTransition>
      </AppShellContext.Provider>
    );
  }

  return (
    <AppShellContext.Provider value={{ mode, changeMode }}>
      <div className="fixed inset-0 z-0">
        <img
          src={modeConfig.thumb}
          alt=""
          className="w-full h-full object-cover saturate-110 contrast-105 transition-opacity duration-500"
        />
        <div className={`absolute inset-0 ${modeConfig.overlay} pointer-events-none transition-colors duration-500`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>
      <PageTransition pathname={pathname ?? ""}>{children}</PageTransition>
    </AppShellContext.Provider>
  );
}
