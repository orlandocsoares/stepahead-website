import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET /api/turmas/[id]/membros — lista formandos da turma
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await context.params;

  const result = await dbQuery(`
    SELECT p.id, p.first_name, p.last_name, p.email
    FROM turma_membros tm
    INNER JOIN profiles p ON p.id = tm.formando_id
    WHERE tm.turma_id = $1
    ORDER BY p.first_name
  `, [id]);

  return NextResponse.json({ data: result.rows });
}

// POST /api/turmas/[id]/membros — adicionar formando(s)
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await context.params;
  const { formando_ids } = await req.json();
  if (!Array.isArray(formando_ids) || formando_ids.length === 0) {
    return NextResponse.json({ error: "formando_ids obrigatório" }, { status: 400 });
  }

  for (const fid of formando_ids) {
    await dbQuery(
      `INSERT INTO turma_membros (turma_id, formando_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, fid]
    );
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/turmas/[id]/membros?formando_id=... — remover formando
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await context.params;
  const formando_id = new URL(req.url).searchParams.get("formando_id");
  if (!formando_id) return NextResponse.json({ error: "formando_id obrigatório" }, { status: 400 });

  await dbQuery(`DELETE FROM turma_membros WHERE turma_id = $1 AND formando_id = $2`, [id, formando_id]);
  return NextResponse.json({ ok: true });
}
