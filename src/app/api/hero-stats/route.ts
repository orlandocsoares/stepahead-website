import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

// GET /api/hero-stats — estatísticas para a página pública (sem autenticação)
export async function GET() {
  const [statsRes, areasRes, eventoRes, formadoresRes] = await Promise.all([
    dbQuery(
      `SELECT
         (SELECT COUNT(*) FROM profiles WHERE role = 'formador' AND status = 'activo') AS total_formadores,
         (SELECT COUNT(*) FROM profiles WHERE role = 'formando' AND status = 'activo') AS total_formandos,
         (SELECT COUNT(*) FROM arquivos) AS total_materials,
         (SELECT media_radar FROM hero_telemetria LIMIT 1) AS media_radar,
         (SELECT COUNT(*) FROM turmas) AS total_turmas`,
      []
    ),
    dbQuery(
      `SELECT area, COUNT(*) AS total
       FROM arquivos
       WHERE area IS NOT NULL AND area != ''
       GROUP BY area
       ORDER BY total DESC`,
      []
    ),
    dbQuery(
      `SELECT titulo, data_inicio
       FROM agenda_atividades
       WHERE data_inicio >= NOW()
       ORDER BY data_inicio ASC
       LIMIT 1`,
      []
    ),
    dbQuery(
      `SELECT id, first_name, last_name, especialidade, biografia, avatar_url
       FROM profiles
       WHERE role = 'formador' AND status = 'activo'
       ORDER BY first_name ASC
       LIMIT 6`,
      []
    ),
  ]);

  const stats = statsRes.rows[0] ?? {};
  const areas = areasRes.rows.map((r: any) => ({ area: r.area, total: Number(r.total) }));
  const evento = eventoRes.rows[0] ?? null;

  // Limpar especialidade server-side: remover emails e desserializar arrays JSON
  function cleanEspecialidade(raw: any): string {
    if (!raw) return "";
    let val: any = raw;
    if (typeof val === "string" && val.trim().startsWith("[")) {
      try { val = JSON.parse(val); } catch { val = raw; }
    }
    if (Array.isArray(val)) {
      const parts = val
        .map((s: any) => String(s).trim())
        .filter(s => s.length > 0 && !s.includes("@"));
      return parts.join(" · ");
    }
    return String(val)
      .replace(/\S+@\S+\.\S+/g, "")
      .replace(/[\[\]"]/g, "")
      .replace(/,\s*/g, " · ")
      .trim();
  }

  const formadores = formadoresRes.rows.map((f: any) => ({
    ...f,
    especialidade: cleanEspecialidade(f.especialidade),
  }));

  return NextResponse.json({
    total_formadores:    Number(stats.total_formadores ?? 0),
    total_formandos:     Number(stats.total_formandos ?? 0),
    total_materials:     Number(stats.total_materials ?? 0),
    total_turmas:        Number(stats.total_turmas ?? 0),
    media_radar:         stats.media_radar ?? null,
    areas_materiais:     areas,
    proximo_evento:      evento?.titulo ?? null,
    data_proximo_evento: evento?.data_inicio ?? null,
    formadores_lista:    formadores,
  });
}
