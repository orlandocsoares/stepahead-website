"use client";

import { MODES, type SiteMode } from "@/lib/site-mode";
import { useAppMode } from "./AppShell";

export function ModeSelector() {
  const { mode, changeMode } = useAppMode();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 backdrop-blur border border-white/10">
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => changeMode(m.id as SiteMode)}
          title={m.label}
          className={`relative w-8 h-8 rounded-lg overflow-hidden transition-all duration-200 ${
            mode === m.id
              ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-black/40 scale-105"
              : "opacity-50 hover:opacity-80"
          }`}
        >
          <img src={m.thumb} alt={m.label} className="w-full h-full object-cover" />
          {mode === m.id && (
            <div className="absolute inset-0 bg-blue-400/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
