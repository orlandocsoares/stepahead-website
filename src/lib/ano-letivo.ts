export function getAnoLetivoActivo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Ano letivo começa em Setembro — antes de Set usa ano anterior/actual
  return month >= 9
    ? `${year}/${year + 1}`
    : `${year - 1}/${year}`;
}

export function getAnosLetivos(): string[] {
  const active = getAnoLetivoActivo();
  const [start] = active.split("/").map(Number);
  return [
    `${start - 1}/${start}`,
    `${start}/${start + 1}`,
    `${start + 1}/${start + 2}`,
  ];
}
