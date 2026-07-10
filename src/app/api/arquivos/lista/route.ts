import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

// GET /api/arquivos/lista — lista ficheiros com grupos de formação incluídos, respeitando visibilidade
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role ?? "formando";
  const isAdmin = role === "admin" || role === "super-admin";

  let whereSql = "";
  const values: unknown[] = [];

  if (!isAdmin) {
    if (role === "formador") {
      // formador: vê sempre os seus (qualquer área); ficheiros "publico"/"formadores" de outros só
      // se forem da área de alguma acção de formação que este formador lecciona (ou área "Geral").
      whereSql = `WHERE (
        a.uploader_id = $1
        OR (a.visibilidade IN ('publico', 'formadores') AND (
          a.area = 'Geral'
          OR a.area IN (
            SELECT af.area FROM acao_formadores acf
            INNER JOIN acoes_formacao af ON af.id = acf.acao_formacao_id
            WHERE acf.formador_id = $1 AND af.area IS NOT NULL
          )
        ))
        OR (a.visibilidade IN ('turma', 'formadores_turma') AND a.turma_id IN (
          SELECT id FROM turmas WHERE formador_id = $1
        ))
        OR (a.visibilidade IN ('acao_formacao', 'formadores_acao') AND a.acao_formacao_id IN (
          SELECT acao_formacao_id FROM acao_formadores WHERE formador_id = $1
        ))
      )`;
      values.push(session.id);
    } else {
      // formando: só vê ficheiros explicitamente publicados numa Acção de Formação em que está
      // inscrito, dentro da janela de disponibilidade dessa publicação.
      whereSql = `WHERE EXISTS (
        SELECT 1 FROM arquivo_acoes_formacao l
        INNER JOIN inscricoes_acao ia ON ia.acao_formacao_id = l.acao_formacao_id
        WHERE l.arquivo_id = a.id
          AND ia.formando_id = $1 AND ia.status = 'inscrito'
          AND (l.disponivel_de IS NULL OR l.disponivel_de <= NOW())
          AND (l.disponivel_ate IS NULL OR l.disponivel_ate >= NOW())
      )`;
      values.push(session.id);
    }
  }

  const res = await dbQuery(
    `SELECT a.*,
            COALESCE(
              json_agg(ag.grupo_id) FILTER (WHERE ag.grupo_id IS NOT NULL),
              '[]'
            ) AS grupos
     FROM arquivos a
     LEFT JOIN arquivo_grupos ag ON ag.arquivo_id = a.id
     ${whereSql}
     GROUP BY a.id
     ORDER BY a.created_at DESC`,
    values
  );

  return NextResponse.json({ data: res.rows });
}
