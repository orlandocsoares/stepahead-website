export const CAPA_GERAL = "/capas/geral.jpg";

export const AREA_COVERS: Record<string, string> = {
  "matematica": "/capas/matematica.jpg",
  "lingua portuguesa": "/capas/lingua-portuguesa.jpg",
  "educacao especial": "/capas/educacao-especial.jpg",
  "educacao pre-escolar": "/capas/educacao-pre-escolar.jpg",
  "expressao motora": "/capas/expressao-motora.jpg",
  "expressao plastica": "/capas/expressao-plastica.jpg",
};

export function normalizeAreaName(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function getAreaCover(area: string): string | null {
  return AREA_COVERS[normalizeAreaName(area)] ?? null;
}

export function isBrandedCapa(url?: string | null): boolean {
  return !!url && (url === CAPA_GERAL || Object.values(AREA_COVERS).includes(url));
}
