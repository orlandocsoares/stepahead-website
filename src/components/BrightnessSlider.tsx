"use client";

import { Sun, Moon } from "lucide-react";
import { useBrightness } from "@/lib/brightness";

export function BrightnessSlider() {
  const { brightness, setBrightness } = useBrightness();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur border border-white/10">
      <Moon size={12} className="c-tx5 shrink-0" />
      <input
        type="range"
        min={10}
        max={100}
        value={brightness}
        onChange={e => setBrightness(Number(e.target.value))}
        className="w-20 h-1 appearance-none rounded-full cursor-pointer brightness-slider"
        title={`Luminosidade: ${brightness}%`}
      />
      <Sun size={13} className="c-tx4 shrink-0" />
    </div>
  );
}
