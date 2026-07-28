import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET /api/search?q=<termo> — pesquisa global: acções de formação, documentos,
// tarefas e (para staff) utilizadores. Cada bloco respeita a mesma visibilidade
// já aplicada nas respectivas páginas — a pesquisa não abre acesso a mais nada.
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ acoes: [], documentos: [], tarefas: [], utilizadores: [] });

  const like = `%${q}%`;
  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = roleRes.rows[0]?.role ?? "formando";
  const isStaff = role === "formador" || role === "admin" || role === "super-admin";
  const isAdmin = role === "admin" || role === "super-admin";

  const [acoes, documentos, tarefas, utilizadores] = await Promise.all([
    dbQuery(
      `SELECT id, designacao, estado FROM acoes_formacao WHERE designacao ILIKE $1 ORDER BY data_inicio DESC NULLS LAST LIMIT 6`,
      [like]
    ),

    (async () => {
      if (isAdmin) {
        return dbQuery(`SELECT id, label, area FROM arquivos WHERE label ILIKE $1 ORDER BY created_at DESC LIMIT 6`, [like]);
      }
      if (role === "formador") {
        return dbQuery(
          `SELECT a.id, a.label, a.area FROM arquivos a
           WHERE a.label ILIKE $2 AND (
             a.uploader_id = $1
             OR (a.visibilidade IN ('publico', 'formadores') AND (
               a.area = 'Geral'
               OR a.area IN (
                 SELECT af.area FROM acao_formadores acf
                 INNER JOIN acoes_formacao af ON af.id = acf.acao_formacao_id
                 WHERE acf.formador_id = $1 AND af.area IS NOT NULL
               )
             ))
             OR (a.visibilidade IN ('acao_formacao', 'formadores_acao') AND a.acao_formacao_id IN (
               SELECT acao_formacao_id FROM acao_formadores WHERE formador_id = $1
             ))
           )
           ORDER BY a.created_at DESC LIMIT 6`,
          [session.id, like]
        );
      }
      // formando: só documentos publicados numa acção em que está inscrito
      return dbQuery(
        `SELECT a.id, a.label, a.area FROM arquivos a
         WHERE a.label ILIKE $2 AND EXISTS (
           SELECT 1 FROM arquivo_acoes_formacao l
           INNER JOIN inscricoes_acao ia ON ia.acao_formacao_id = l.acao_formacao_id
           WHERE l.arquivo_id = a.id AND ia.formando_id = $1 AND ia.status = 'inscrito'
             AND (l.disponivel_de IS NULL OR l.disponivel_de <= NOW())
             AND (l.disponivel_ate IS NULL OR l.disponivel_ate >= NOW())
         )
         ORDER BY a.created_at DESC LIMIT 6`,
        [session.id, like]
      );
    })(),

    (async () => {
      if (role === "formando") {
        return dbQuery(
          `SELECT t.id, t.titulo FROM tarefa_destinatarios td
           JOIN tarefas t ON t.id = td.tarefa_id
           WHERE td.formando_id = $1 AND t.titulo ILIKE $2
           ORDER BY t.created_at DESC LIMIT 6`,
          [session.id, like]
        );
      }
      return dbQuery(
        `SELECT id, titulo FROM tarefas WHERE titulo ILIKE $2 AND ($1::boolean OR criador_id = $3) ORDER BY created_at DESC LIMIT 6`,
        [isAdmin, like, session.id]
      );
    })(),

    isStaff
      ? dbQuery(
          `SELECT id, first_name, last_name, email, role FROM profiles
           WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1) AND status = 'activo'
           ORDER BY first_name LIMIT 6`,
          [like]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return NextResponse.json({
    acoes: acoes.rows,
    documentos: documentos.rows,
    tarefas: tarefas.rows,
    utilizadores: utilizadores.rows,
  });
}
