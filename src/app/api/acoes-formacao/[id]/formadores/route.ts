import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

// GET /api/acoes-formacao/[id]/formadores — lista formadores associados à acção
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const result = await dbQuery(`
    SELECT p.id, p.first_name, p.last_name, p.email
    FROM acao_formadores af
    INNER JOIN profiles p ON p.id = af.formador_id
    WHERE af.acao_formacao_id = $1
    ORDER BY p.first_name
  `, [id]);
  return NextResponse.json({ data: result.rows });
}

// POST /api/acoes-formacao/[id]/formadores — associar formador(es) (admin apenas)
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { formador_ids } = await req.json();
  if (!Array.isArray(formador_ids) || formador_ids.length === 0) {
    return NextResponse.json({ error: "formador_ids obrigatório" }, { status: 400 });
  }
  for (const fid of formador_ids) {
    await dbQuery(`INSERT INTO acao_formadores (acao_formacao_id, formador_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, fid]);
    await auditLog("acao_formacao_formador_add", { actorId: sessionUser.id, targetId: fid, details: { acao_formacao_id: id } });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/acoes-formacao/[id]/formadores?formador_id=... — remover formador (admin apenas)
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formador_id = new URL(req.url).searchParams.get("formador_id");
  if (!formador_id) return NextResponse.json({ error: "formador_id obrigatório" }, { status: 400 });

  await dbQuery(`DELETE FROM acao_formadores WHERE acao_formacao_id = $1 AND formador_id = $2`, [id, formador_id]);
  await auditLog("acao_formacao_formador_remove", { actorId: sessionUser.id, targetId: formador_id, details: { acao_formacao_id: id } });
  return NextResponse.json({ ok: true });
}
