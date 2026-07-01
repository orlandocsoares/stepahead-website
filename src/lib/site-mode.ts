export type SiteMode = "escuro" | "meio-escuro" | "meio-claro" | "claro";

export const MODES: { id: SiteMode; label: string; thumb: string; overlay: string; blur: string }[] = [
  {
    id: "escuro",
    label: "Madrugada",
    thumb: "/modos/escuro.png",
    overlay: "bg-black/35",
    blur: "backdrop-blur-[8px]",
  },
  {
    id: "meio-escuro",
    label: "Meia Noite",
    thumb: "/modos/meio-escuro.webp",
    overlay: "bg-blue-950/25",
    blur: "backdrop-blur-[6px]",
  },
  {
    id: "meio-claro",
    label: "Pôr do Sol",
    thumb: "/modos/meio-claro.webp",
    overlay: "bg-amber-950/30",
    blur: "backdrop-blur-[6px]",
  },
  {
    id: "claro",
    label: "Dia",
    thumb: "/modos/claro.webp",
    overlay: "bg-white/20",
    blur: "backdrop-blur-[10px]",
  },
];

const KEY = "sabermais-mode";

export function getSavedMode(): SiteMode {
  if (typeof window === "undefined") return "escuro";
  return (localStorage.getItem(KEY) as SiteMode) ?? "escuro";
}

export function saveMode(mode: SiteMode) {
  localStorage.setItem(KEY, mode);
}

export function applyMode(mode: SiteMode) {
  const html = document.documentElement;
  html.classList.remove("escuro", "meio-escuro", "meio-claro", "light");
  if (mode === "claro") html.classList.add("light");
  else if (mode !== "escuro") html.classList.add(mode);

  // Define a imagem de fundo usada pelo dashboard layout via --dash-bg-image
  const config = MODES.find(m => m.id === mode);
  if (config) {
    html.style.setProperty("--dash-bg-image", `url('${config.thumb}')`);
  }
}
