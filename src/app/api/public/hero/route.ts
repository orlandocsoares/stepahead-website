import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const safe = (p: Promise<any>) => p.catch(() => ({ rows: [] }));

  const [formadores, proximoEvento, totalMateriais, telemetria] = await Promise.all([
    safe(dbQuery(`
      SELECT first_name, last_name, specialization AS especialidade, biografia, avatar_url
      FROM profiles
      WHERE role = 'formador' AND status = 'activo'
      LIMIT 6
    `)),
    safe(dbQuery(`
      SELECT titulo AS proximo_evento
      FROM agenda_atividades
      WHERE data_evento >= NOW()
      ORDER BY data_evento ASC
      LIMIT 1
    `)),
    safe(dbQuery(`SELECT COUNT(*) AS total FROM arquivos WHERE status = 'publicado'`)),
    safe(dbQuery(`SELECT media_radar FROM hero_telemetria LIMIT 1`)),
  ]);

  return NextResponse.json({
    formadores_lista: formadores.rows,
    total_formadores: formadores.rows.length,
    proximo_evento: proximoEvento.rows[0]?.proximo_evento ?? null,
    total_materials: Number(totalMateriais.rows[0]?.total ?? 0) || null,
    media_radar: telemetria.rows[0]?.media_radar ?? null,
  });
}
