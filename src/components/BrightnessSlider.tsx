"use client";

import { Moon, Sun } from "lucide-react";
import { MODES, type SiteMode } from "@/lib/site-mode";
import { useAppMode } from "./AppShell";

export function BrightnessSlider() {
  const { mode, changeMode } = useAppMode();
  const index = MODES.findIndex(m => m.id === mode);
  const currentIndex = index === -1 ? 0 : index;
  const currentLabel = MODES[currentIndex]?.label ?? "";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur border border-white/10 group/slider">
      <Moon size={12} className="c-tx5 shrink-0" />

      <div className="relative flex flex-col items-center">
        {/* Tooltip com nome do modo */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <span className="whitespace-nowrap text-[9px] uppercase tracking-widest font-semibold bg-black/70 backdrop-blur text-white/80 px-2 py-0.5 rounded-md border border-white/10">
            {currentLabel}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={MODES.length - 1}
          step={1}
          value={currentIndex}
          onChange={e => changeMode(MODES[Number(e.target.value)].id as SiteMode)}
          className="w-24 h-1 appearance-none rounded-full cursor-pointer brightness-slider"
        />

        {/* Tick marks por baixo do slider */}
        <div className="flex justify-between w-24 mt-1 px-[5px]">
          {MODES.map((_, i) => (
            <div
              key={i}
              className={`w-[2px] h-[5px] rounded-full transition-colors duration-200 ${
                i === currentIndex ? "bg-white/70" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      <Sun size={13} className="c-tx4 shrink-0" />
    </div>
  );
}
