export type SiteMode = "escuro" | "meio-escuro" | "meio-claro" | "claro" | "neutro";

// Swatch da opção "Neutro" — quadrado cinza muito claro, sem foto de fundo.
const NEUTRO_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='%23eef1f5'/><rect x='0.5' y='0.5' width='31' height='31' fill='none' stroke='%23c7ced8'/></svg>"
  );

export const MODES: { id: SiteMode; label: string; thumb: string; overlay: string; blur: string; bg?: string }[] = [
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
  {
    id: "neutro",
    label: "Neutro",
    thumb: NEUTRO_THUMB,
    overlay: "bg-white/0",
    blur: "backdrop-blur-none",
    bg: "none",
  },
];

const KEY = "sabermais-mode";

export function getSavedMode(): SiteMode {
  if (typeof window === "undefined") return "neutro";
  return (localStorage.getItem(KEY) as SiteMode) ?? "neutro";
}

export function saveMode(mode: SiteMode) {
  localStorage.setItem(KEY, mode);
}

export function applyMode(mode: SiteMode) {
  const html = document.documentElement;
  html.classList.remove("escuro", "meio-escuro", "meio-claro", "light", "neutro");
  if (mode === "claro") html.classList.add("light");
  // "Neutro" reaproveita os ajustes de contraste do modo Claro (classe "light"),
  // acrescentando "neutro" só para trocar a imagem de fundo por um fundo sólido.
  else if (mode === "neutro") html.classList.add("light", "neutro");
  else if (mode !== "escuro") html.classList.add(mode);

  // Define a imagem de fundo usada pelo dashboard layout via --dash-bg-image
  const config = MODES.find(m => m.id === mode);
  if (config) {
    const bg = config.bg ?? config.thumb;
    html.style.setProperty("--dash-bg-image", bg === "none" ? "none" : `url('${bg}')`);
  }
}
