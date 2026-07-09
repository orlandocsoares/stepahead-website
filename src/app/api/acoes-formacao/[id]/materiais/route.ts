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

// GET /api/acoes-formacao/[id]/materiais — lista ficheiros do repositório publicados nesta acção
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const result = await dbQuery(`
    SELECT l.id AS link_id, l.disponivel_de, l.disponivel_ate, a.id, a.label, a.tamanho, a.area, a.tipo
    FROM arquivo_acoes_formacao l
    INNER JOIN arquivos a ON a.id = l.arquivo_id
    WHERE l.acao_formacao_id = $1
    ORDER BY l.created_at DESC
  `, [id]);
  return NextResponse.json({ data: result.rows });
}

// POST /api/acoes-formacao/[id]/materiais — publicar um ficheiro existente do repositório nesta acção,
// com janela de disponibilidade opcional
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (!(await isAcaoManager(sessionUser.id, role, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { arquivo_id, disponivel_de, disponivel_ate } = await req.json();
  if (!arquivo_id) return NextResponse.json({ error: "arquivo_id obrigatório" }, { status: 400 });

  const result = await dbQuery(
    `INSERT INTO arquivo_acoes_formacao (arquivo_id, acao_formacao_id, disponivel_de, disponivel_ate)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (arquivo_id, acao_formacao_id) DO UPDATE SET disponivel_de = $3, disponivel_ate = $4
     RETURNING *`,
    [arquivo_id, id, disponivel_de || null, disponivel_ate || null]
  );
  await auditLog("acao_formacao_material_link", { actorId: sessionUser.id, targetId: arquivo_id, details: { acao_formacao_id: id } });
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/acoes-formacao/[id]/materiais?link_id=... — remover a publicação de um ficheiro nesta acção
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (!(await isAcaoManager(sessionUser.id, role, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const linkId = new URL(req.url).searchParams.get("link_id");
  if (!linkId) return NextResponse.json({ error: "link_id obrigatório" }, { status: 400 });

  await dbQuery(`DELETE FROM arquivo_acoes_formacao WHERE id = $1 AND acao_formacao_id = $2`, [linkId, id]);
  await auditLog("acao_formacao_material_unlink", { actorId: sessionUser.id, targetId: linkId, details: { acao_formacao_id: id } });
  return NextResponse.json({ ok: true });
}
