import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const safe = (p: Promise<any>) => p.catch(() => ({ rows: [] }));

  const [acoes] = await Promise.all([
    safe(dbQuery(`
      SELECT
        af.id, af.designacao AS titulo, af.area, af.tipologia, af.local, af.provincia,
        af.data_inicio, af.data_fim, af.horario, af.publico_alvo, af.vagas_max, af.estado,
        af.imagem_url, aa.id AS agenda_evento_id, aa.endereco,
        COUNT(ia.id) FILTER (WHERE ia.status != 'cancelado') AS total_inscritos
      FROM acoes_formacao af
      LEFT JOIN inscricoes_acao ia ON ia.acao_formacao_id = af.id
      LEFT JOIN agenda_atividades aa ON aa.acao_formacao_id = af.id
      GROUP BY af.id, aa.id, aa.endereco
      ORDER BY af.data_inicio ASC NULLS LAST
    `)),
  ]);

  const eventosPorArea: Record<string, any[]> = {};
  for (const a of acoes.rows as any[]) {
    const key = a.area?.trim() || "Geral";
    const vagas = a.vagas_max ? Number(a.vagas_max) : null;
    const inscritos = Number(a.total_inscritos ?? 0);
    const estado =
      a.estado === "cancelada" ? "cancelada" :
      a.estado === "concluida" ? "concluida" :
      vagas !== null && inscritos >= vagas ? "esgotado" :
      "agendada";

    if (!eventosPorArea[key]) eventosPorArea[key] = [];
    eventosPorArea[key].push({
      id: a.id,
      agenda_evento_id: a.agenda_evento_id || null,
      titulo: a.titulo,
      area: key,
      tipologia: a.tipologia || null,
      local: a.local || a.provincia || null,
      endereco: a.endereco || null,
      data_inicio: a.data_inicio,
      data_fim: a.data_fim,
      horario: a.horario,
      publico_alvo: a.publico_alvo || null,
      estado,
      total_inscritos: inscritos,
      vagas_max: vagas,
      imagem_url: a.imagem_url,
    });
  }

  const areas = Object.entries(eventosPorArea)
    .filter(([, items]) => items.length > 0)
    .map(([area, items]) => ({ area, total: items.length, eventos: items }));

  return NextResponse.json({ areas });
}
