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
      SELECT p.id, p.first_name, p.last_name, p.email, p.provincia, i.status, i.created_at
      FROM inscricoes_acao i
      INNER JOIN profiles p ON p.id = i.formando_id
      WHERE i.acao_formacao_id = $1 AND i.status IN ('inscrito', 'pendente')
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
  let isStaffAdding = false;

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
    isStaffAdding = true;
  }

  const acaoRes = await dbQuery(`SELECT vagas_max, estado FROM acoes_formacao WHERE id = $1 LIMIT 1`, [id]);
  const acao = acaoRes.rows[0];
  if (!acao) return NextResponse.json({ error: "Acção de formação não encontrada" }, { status: 404 });
  if (acao.estado === "cancelada" || acao.estado === "concluida") {
    return NextResponse.json({ error: "Esta acção de formação já não aceita inscrições" }, { status: 400 });
  }

  // Auto-inscrição do próprio formando fica pendente de confirmação do responsável;
  // quando é o próprio staff (admin/formador da acção) a adicionar, fica logo confirmada.
  const status = isStaffAdding ? "inscrito" : "pendente";

  if (status === "inscrito" && acao.vagas_max != null) {
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
     VALUES ($1, $2, $3)
     ON CONFLICT (formando_id, acao_formacao_id) DO UPDATE SET status = $3
     RETURNING *`,
    [targetFormandoId, id, status]
  );

  if (status === "pendente") {
    const acaoInfo = await dbQuery(`SELECT designacao FROM acoes_formacao WHERE id = $1 LIMIT 1`, [id]);
    const formandoInfo = await dbQuery(`SELECT first_name, last_name FROM profiles WHERE id = $1 LIMIT 1`, [targetFormandoId]);
    const designacao = acaoInfo.rows[0]?.designacao ?? "acção de formação";
    const nomeFormando = `${formandoInfo.rows[0]?.first_name ?? ""} ${formandoInfo.rows[0]?.last_name ?? ""}`.trim();
    const responsaveis = await dbQuery(
      `SELECT formador_id AS id FROM acao_formadores WHERE acao_formacao_id = $1
       UNION SELECT id FROM profiles WHERE role IN ('admin', 'super-admin')`,
      [id]
    );
    for (const r of responsaveis.rows) {
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'nova_inscricao', 'Nova inscrição pendente', $2, '/dashboard/acoes-formacao')`,
        [r.id, `${nomeFormando} inscreveu-se em "${designacao}" e aguarda confirmação.`]
      );
    }
  }

  await auditLog("acao_formacao_inscricao_create", { actorId: sessionUser.id, targetId: targetFormandoId, details: { acao_formacao_id: id, status } });
  return NextResponse.json({ data: result.rows[0] });
}

// PATCH /api/acoes-formacao/[id]/inscricoes — aprovar ou rejeitar uma inscrição pendente (staff da acção)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormadorDaAcao = role === "formador" && (
    await dbQuery(`SELECT 1 FROM acao_formadores WHERE acao_formacao_id = $1 AND formador_id = $2 LIMIT 1`, [id, sessionUser.id])
  ).rows.length > 0;
  if (!isAdmin && !isFormadorDaAcao) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { formando_id, status } = await req.json();
  if (!formando_id || !["inscrito", "cancelado"].includes(status)) {
    return NextResponse.json({ error: "formando_id e status ('inscrito' ou 'cancelado') obrigatórios" }, { status: 400 });
  }

  if (status === "inscrito") {
    const acaoRes = await dbQuery(`SELECT vagas_max FROM acoes_formacao WHERE id = $1 LIMIT 1`, [id]);
    const vagasMax = acaoRes.rows[0]?.vagas_max;
    if (vagasMax != null) {
      const countRes = await dbQuery(
        `SELECT COUNT(*)::int AS total FROM inscricoes_acao WHERE acao_formacao_id = $1 AND status = 'inscrito'`,
        [id]
      );
      if (countRes.rows[0].total >= vagasMax) {
        return NextResponse.json({ error: "Não há vagas disponíveis" }, { status: 400 });
      }
    }
  }

  await dbQuery(
    `UPDATE inscricoes_acao SET status = $3 WHERE acao_formacao_id = $1 AND formando_id = $2`,
    [id, formando_id, status]
  );
  await auditLog(
    status === "inscrito" ? "acao_formacao_inscricao_create" : "acao_formacao_inscricao_cancel",
    { actorId: sessionUser.id, targetId: formando_id, details: { acao_formacao_id: id, status } }
  );
  return NextResponse.json({ ok: true });
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
