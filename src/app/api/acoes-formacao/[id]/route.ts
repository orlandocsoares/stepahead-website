import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

async function isAcaoManager(userId: string, role: string, acaoId: string) {
  if (role === "admin" || role === "super-admin") return true;
  if (role !== "formador") return false;
  const res = await dbQuery(
    `SELECT 1 FROM acao_formadores WHERE acao_formacao_id = $1 AND formador_id = $2 LIMIT 1`,
    [acaoId, userId]
  );
  return !!res.rows[0];
}

// PATCH /api/acoes-formacao/[id] — actualizar dados da acção (admin ou formador associado)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (!(await isAcaoManager(sessionUser.id, role, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const allowed = ["formacao_id", "designacao", "data_inicio", "data_fim", "horario", "local", "modalidade", "vagas_max", "estado", "imagem_url", "area"];
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para actualizar" }, { status: 400 });
  }

  const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`);
  const values = Object.values(updates);
  const result = await dbQuery(
    `UPDATE acoes_formacao SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!result.rows[0]) return NextResponse.json({ error: "Acção de formação não encontrada" }, { status: 404 });
  const acao = result.rows[0];

  // Manter o evento de agenda ligado a esta acção em sincronia
  if ("designacao" in updates || "local" in updates || "data_inicio" in updates || "imagem_url" in updates) {
    const existente = await dbQuery(`SELECT id FROM agenda_atividades WHERE acao_formacao_id = $1 LIMIT 1`, [id]);
    if (existente.rows[0]) {
      await dbQuery(
        `UPDATE agenda_atividades SET titulo = $2, local = $3, data_evento = COALESCE($4, data_evento), imagem_url = COALESCE($5, imagem_url) WHERE id = $1`,
        [existente.rows[0].id, acao.designacao, acao.local?.trim() || "A definir", acao.data_inicio, acao.imagem_url]
      );
    } else if (acao.data_inicio) {
      await dbQuery(
        `INSERT INTO agenda_atividades (titulo, local, data_evento, tipo, acao_formacao_id, imagem_url)
         VALUES ($1, $2, $3, 'Restrito', $4, $5)`,
        [acao.designacao, acao.local?.trim() || "A definir", acao.data_inicio, id, acao.imagem_url || null]
      );
    }
  }

  await auditLog("acao_formacao_update", { actorId: sessionUser.id, targetId: id, details: updates });
  return NextResponse.json({ data: acao });
}

// DELETE /api/acoes-formacao/[id] — apagar acção (admin ou formador associado)
export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (!(await isAcaoManager(sessionUser.id, role, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await dbQuery(`DELETE FROM agenda_atividades WHERE acao_formacao_id = $1`, [id]);
  const result = await dbQuery(`DELETE FROM acoes_formacao WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows[0]) return NextResponse.json({ error: "Acção de formação não encontrada" }, { status: 404 });

  await auditLog("acao_formacao_delete", { actorId: sessionUser.id, targetId: id });
  return NextResponse.json({ ok: true });
}
