import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

// GET /api/acoes-formacao/[id]/inscricoes — lista de inscritos (staff da acção) ou o estado da própria inscrição
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormadorDaAcao = role === "formador" && (
    await dbQuery(`SELECT 1 FROM acao_formadores WHERE acao_formacao_id = $1 AND formador_id = $2 LIMIT 1`, [id, sessionUser.id])
  ).rows.length > 0;

  if (isAdmin || isFormadorDaAcao) {
    const result = await dbQuery(`
      SELECT p.id, p.first_name, p.last_name, p.email, i.status, i.created_at
      FROM inscricoes_acao i
      INNER JOIN profiles p ON p.id = i.formando_id
      WHERE i.acao_formacao_id = $1
      ORDER BY i.created_at ASC
    `, [id]);
    return NextResponse.json({ data: result.rows });
  }

  const own = await dbQuery(
    `SELECT status, created_at FROM inscricoes_acao WHERE acao_formacao_id = $1 AND formando_id = $2 LIMIT 1`,
    [id, sessionUser.id]
  );
  return NextResponse.json({ data: own.rows[0] ?? null });
}

// POST /api/acoes-formacao/[id]/inscricoes — o formando inscreve-se na acção
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const body = await req.json().catch(() => ({}));
  let targetFormandoId = sessionUser.id;

  if (body?.formando_id && body.formando_id !== sessionUser.id) {
    const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
    const role = roleRes.rows[0]?.role;
    const isAdmin = role === "admin" || role === "super-admin";
    const isFormadorDaAcao = role === "formador" && (
      await dbQuery(`SELECT 1 FROM acao_formadores WHERE acao_formacao_id = $1 AND formador_id = $2 LIMIT 1`, [id, sessionUser.id])
    ).rows.length > 0;
    if (!isAdmin && !isFormadorDaAcao) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    targetFormandoId = body.formando_id;
  }

  const acaoRes = await dbQuery(`SELECT vagas_max, estado FROM acoes_formacao WHERE id = $1 LIMIT 1`, [id]);
  const acao = acaoRes.rows[0];
  if (!acao) return NextResponse.json({ error: "Acção de formação não encontrada" }, { status: 404 });
  if (acao.estado === "cancelada" || acao.estado === "concluida") {
    return NextResponse.json({ error: "Esta acção de formação já não aceita inscrições" }, { status: 400 });
  }

  if (acao.vagas_max != null) {
    const countRes = await dbQuery(
      `SELECT COUNT(*)::int AS total FROM inscricoes_acao WHERE acao_formacao_id = $1 AND status = 'inscrito'`,
      [id]
    );
    if (countRes.rows[0].total >= acao.vagas_max) {
      return NextResponse.json({ error: "Não há vagas disponíveis" }, { status: 400 });
    }
  }

  const result = await dbQuery(
    `INSERT INTO inscricoes_acao (formando_id, acao_formacao_id, status)
     VALUES ($1, $2, 'inscrito')
     ON CONFLICT (formando_id, acao_formacao_id) DO UPDATE SET status = 'inscrito'
     RETURNING *`,
    [targetFormandoId, id]
  );
  await auditLog("acao_formacao_inscricao_create", { actorId: sessionUser.id, targetId: targetFormandoId, details: { acao_formacao_id: id } });
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/acoes-formacao/[id]/inscricoes — cancelar a própria inscrição (ou staff cancela a de outro via ?formando_id=)
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const formandoIdParam = new URL(req.url).searchParams.get("formando_id");
  let targetFormandoId = sessionUser.id;

  if (formandoIdParam && formandoIdParam !== sessionUser.id) {
    const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
    const role = roleRes.rows[0]?.role;
    const isAdmin = role === "admin" || role === "super-admin";
    const isFormadorDaAcao = role === "formador" && (
      await dbQuery(`SELECT 1 FROM acao_formadores WHERE acao_formacao_id = $1 AND formador_id = $2 LIMIT 1`, [id, sessionUser.id])
    ).rows.length > 0;
    if (!isAdmin && !isFormadorDaAcao) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    targetFormandoId = formandoIdParam;
  }

  await dbQuery(
    `UPDATE inscricoes_acao SET status = 'cancelado' WHERE acao_formacao_id = $1 AND formando_id = $2`,
    [id, targetFormandoId]
  );
  await auditLog("acao_formacao_inscricao_cancel", { actorId: sessionUser.id, targetId: targetFormandoId, details: { acao_formacao_id: id } });
  return NextResponse.json({ ok: true });
}
