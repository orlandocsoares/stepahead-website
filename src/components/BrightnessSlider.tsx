"use client";

import { Moon, Sun } from "lucide-react";
import { MODES, type SiteMode } from "@/lib/site-mode";
import { useAppMode } from "./AppShell";

export function BrightnessSlider() {
  const { mode, changeMode } = useAppMode();
  const index = MODES.findIndex(m => m.id === mode);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur border border-white/10">
      <Moon size={12} className="c-tx5 shrink-0" />
      <input
        type="range"
        min={0}
        max={MODES.length - 1}
        step={1}
        value={index === -1 ? 0 : index}
        onChange={e => changeMode(MODES[Number(e.target.value)].id as SiteMode)}
        className="w-24 h-1 appearance-none rounded-full cursor-pointer brightness-slider"
        title={MODES[index]?.label ?? ""}
      />
      <Sun size={13} className="c-tx4 shrink-0" />
    </div>
  );
}
