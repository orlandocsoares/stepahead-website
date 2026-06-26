import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET /api/turmas — lista turmas com formador e contagem de membros
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isAdmin = ["admin", "super-admin"].includes(sessionUser.role ?? "");
  const isFormador = sessionUser.role === "formador";

  const result = await dbQuery(`
    SELECT
      t.id, t.nome, t.area, t.created_at,
      p.first_name || ' ' || COALESCE(p.last_name, '') AS formador_nome,
      p.id AS formador_id,
      COUNT(tm.formando_id)::int AS total_membros
    FROM turmas t
    LEFT JOIN profiles p ON p.id = t.formador_id
    LEFT JOIN turma_membros tm ON tm.turma_id = t.id
    WHERE ($1::boolean OR t.formador_id = $2)
    GROUP BY t.id, p.first_name, p.last_name, p.id
    ORDER BY t.created_at DESC
  `, [isAdmin, sessionUser.id]);

  return NextResponse.json({ data: result.rows });
}

// POST /api/turmas — criar turma
export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { nome, area, formador_id } = await req.json();
  if (!nome || !area || !formador_id) return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });

  const result = await dbQuery(
    `INSERT INTO turmas (nome, area, formador_id) VALUES ($1, $2, $3) RETURNING *`,
    [nome, area, formador_id]
  );
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/turmas?id=... — apagar turma
export async function DELETE(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  await dbQuery(`DELETE FROM turmas WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
