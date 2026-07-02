import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const safe = (p: Promise<any>) => p.catch(() => ({ rows: [] }));

  const [
    formadores, proximoEvento, totalMateriais, telemetria,
    totalFormandos, provincias, turmas, areasMateriais,
    sessoesRealizadas, areasPublicas, totalPublicos, provinciasStats,
  ] = await Promise.all([
    safe(dbQuery(`
      SELECT id, first_name, last_name, specialization AS especialidade, biografia, avatar_url, provincia
      FROM profiles
      WHERE role = 'formador' AND status IN ('activo', 'email_confirmado')
      ORDER BY first_name ASC
    `)),
    safe(dbQuery(`
      SELECT titulo AS proximo_evento, data_evento
      FROM agenda_atividades
      WHERE data_evento >= NOW()
      ORDER BY data_evento ASC
      LIMIT 1
    `)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM arquivos WHERE visibilidade IN ('publico', 'formadores')`)),
    safe(dbQuery(`SELECT media_radar FROM hero_telemetria LIMIT 1`)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM profiles WHERE role = 'formando' AND status IN ('activo', 'email_confirmado', 'pendente')`)),
    safe(dbQuery(`SELECT COUNT(DISTINCT provincia) AS total FROM profiles WHERE provincia IS NOT NULL AND provincia != ''`)),
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
  ]);

  const provMap: Record<string, { formadores: number; formandos: number }> = {};
  for (const r of provinciasStats.rows) {
    const key = r.prov === 'bie' ? 'bié' : r.prov;
    provMap[key] = { formadores: Number(r.formadores), formandos: Number(r.formandos) };
  }

  return NextResponse.json({
    formadores_lista: formadores.rows,
    total_formadores: formadores.rows.length,
    proximo_evento: proximoEvento.rows[0]?.proximo_evento ?? null,
    proximo_evento_data: proximoEvento.rows[0]?.data_evento ?? null,
    total_materials: Number(totalMateriais.rows[0]?.total ?? 0) || null,
    media_radar: telemetria.rows[0]?.media_radar ?? null,
    total_formandos: Number(totalFormandos.rows[0]?.total ?? 0),
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
  });
}
