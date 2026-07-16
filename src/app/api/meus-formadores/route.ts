import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET — formadores e áreas das acções de formação em que o formando está inscrito
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const formadoresRes = await dbQuery(`
    SELECT DISTINCT p.id, p.first_name, p.last_name, p.avatar_url, p.provincia, p.specialization AS especialidade
    FROM acao_formadores af
    INNER JOIN inscricoes_acao ia ON ia.acao_formacao_id = af.acao_formacao_id
    INNER JOIN profiles p ON p.id = af.formador_id
    WHERE ia.formando_id = $1 AND ia.status = 'inscrito'
    ORDER BY p.first_name ASC
  `, [session.id]);

  const areasRes = await dbQuery(`
    SELECT DISTINCT af.area
    FROM acoes_formacao af
    INNER JOIN inscricoes_acao ia ON ia.acao_formacao_id = af.id
    WHERE ia.formando_id = $1 AND ia.status = 'inscrito' AND af.area IS NOT NULL AND af.area != ''
  `, [session.id]);

  return NextResponse.json({
    formadores: formadoresRes.rows,
    areas: areasRes.rows.map((r: any) => r.area),
  });
}
