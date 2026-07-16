import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const safe = (p: Promise<any>) => p.catch(() => ({ rows: [] }));

  const [
    formadores, proximoEvento, totalMateriais, telemetria,
    totalFormandos, provincias, turmas, areasMateriais,
    sessoesRealizadas, areasPublicas, totalPublicos, provinciasStats,
    disciplinas,
  ] = await Promise.all([
    safe(dbQuery(`
      SELECT id, first_name, last_name, specialization AS especialidade, biografia, avatar_url, provincia
      FROM profiles
      WHERE role = 'formador' AND status IN ('activo', 'email_confirmado')
      ORDER BY first_name ASC
    `)),
    safe(dbQuery(`
      SELECT id, titulo, local, endereco, imagem_url, data_evento, tipo, acao_formacao_id
      FROM agenda_atividades
      WHERE data_evento >= NOW()
      ORDER BY data_evento ASC
      LIMIT 20
    `)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM arquivos WHERE visibilidade IN ('publico', 'formadores')`)),
    safe(dbQuery(`SELECT media_radar, formandos_historico_ajuste, mostrar_formandos_publico FROM hero_telemetria LIMIT 1`)),
    safe(dbQuery(`SELECT COUNT(DISTINCT formando_id) AS total FROM inscricoes_acao WHERE status != 'cancelado'`)),
    safe(dbQuery(`
      SELECT COUNT(DISTINCT p.id) AS total
      FROM acoes_formacao af
      JOIN provincias p ON LOWER(TRIM(af.provincia)) = LOWER(p.nome)
      WHERE af.provincia IS NOT NULL AND TRIM(af.provincia) != ''
    `)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM turmas`)),
    safe(dbQuery(`
      SELECT area, COUNT(*) AS total
      FROM arquivos
      WHERE visibilidade IN ('publico', 'formadores') AND area IS NOT NULL AND area != ''
      GROUP BY area ORDER BY total DESC LIMIT 5
    `)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM agenda_atividades WHERE data_evento < NOW()`)),
    safe(dbQuery(`
      SELECT area, COUNT(*) AS total
      FROM arquivos
      WHERE site_publico = true AND visibilidade = 'publico' AND area IS NOT NULL AND area != ''
        AND (disponivel_de IS NULL OR disponivel_de <= NOW())
        AND (disponivel_ate IS NULL OR disponivel_ate >= NOW())
      GROUP BY area ORDER BY total DESC LIMIT 6
    `)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM arquivos WHERE site_publico = true AND visibilidade = 'publico'`)),
    safe(dbQuery(`
      SELECT
        CASE
          WHEN provincia ILIKE 'luanda' THEN 'luanda'
          WHEN provincia ILIKE 'bi%' THEN 'bié'
        END AS prov,
        COUNT(*) FILTER (WHERE role = 'formador') AS formadores,
        COUNT(*) FILTER (WHERE role = 'formando') AS formandos
      FROM profiles
      WHERE provincia IS NOT NULL AND provincia != ''
        AND (provincia ILIKE 'luanda' OR provincia ILIKE 'bi%')
      GROUP BY prov
    `)),
    safe(dbQuery(`SELECT nome FROM disciplinas WHERE activo = true ORDER BY nome`)),
  ]);

  const provMap: Record<string, { formadores: number; formandos: number }> = {};
  for (const r of provinciasStats.rows) {
    const key = r.prov === 'bie' ? 'bié' : r.prov;
    provMap[key] = { formadores: Number(r.formadores), formandos: Number(r.formandos) };
  }

  return NextResponse.json({
    formadores_lista: formadores.rows,
    total_formadores: formadores.rows.length,
    proximo_evento: proximoEvento.rows[0]?.titulo ?? null,
    proximo_evento_data: proximoEvento.rows[0]?.data_evento ?? null,
    proximos_eventos: proximoEvento.rows,
    total_materials: Number(totalMateriais.rows[0]?.total ?? 0) || null,
    media_radar: telemetria.rows[0]?.media_radar ?? null,
    formandos_historico_ajuste: Number(telemetria.rows[0]?.formandos_historico_ajuste ?? 0),
    mostrar_formandos_publico: telemetria.rows[0]?.mostrar_formandos_publico ?? false,
    total_formandos: telemetria.rows[0]?.mostrar_formandos_publico
      ? Number(totalFormandos.rows[0]?.total ?? 0) + Number(telemetria.rows[0]?.formandos_historico_ajuste ?? 0)
      : null,
    total_provincias: Number(provincias.rows[0]?.total ?? 0),
    total_turmas: Number(turmas.rows[0]?.total ?? 0),
    areas_materiais: areasMateriais.rows.map((r: any) => ({ area: r.area, total: Number(r.total) })),
    areas_publicas: areasPublicas.rows.map((r: any) => ({ area: r.area, total: Number(r.total) })),
    total_recursos_publicos: Number(totalPublicos.rows[0]?.total ?? 0),
    sessoes_realizadas: Number(sessoesRealizadas.rows[0]?.total ?? 0),
    provincias_stats: {
      luanda: provMap['luanda'] ?? { formadores: 0, formandos: 0 },
      bie: provMap['bié'] ?? { formadores: 0, formandos: 0 },
    },
    areas_formacao: disciplinas.rows.map((r: any) => r.nome),
  });
}
