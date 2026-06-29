"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "sabermais-brightness";
const DEFAULT = 55; // valor inicial — meio-termo

export function applyBrightness(value: number) {
  // value: 10–100
  // 10  → overlay muito escuro (bg-black/80)
  // 55  → overlay actual (bg-black/35)
  // 100 → sem overlay (bg-black/0)
  const opacity = Math.round((1 - value / 100) * 0.85 * 100) / 100;
  document.documentElement.style.setProperty("--brightness-overlay", String(opacity));
}

export function getSavedBrightness(): number {
  if (typeof window === "undefined") return DEFAULT;
  return Number(localStorage.getItem(KEY) ?? DEFAULT);
}

export function useBrightness() {
  const [brightness, setBrightnessState] = useState(DEFAULT);

  useEffect(() => {
    const saved = getSavedBrightness();
    setBrightnessState(saved);
    applyBrightness(saved);
  }, []);

  const setBrightness = useCallback((value: number) => {
    setBrightnessState(value);
    localStorage.setItem(KEY, String(value));
    applyBrightness(value);
  }, []);

  return { brightness, setBrightness };
}
