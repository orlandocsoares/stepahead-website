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

// GET /api/acoes-formacao/[id]/fotos — lista fotos desta acção (galeria interna)
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const result = await dbQuery(
    `SELECT id, label, nome_arquivo, created_at
     FROM arquivos
     WHERE acao_formacao_id = $1 AND tipo = 'imagem'
     ORDER BY created_at DESC`,
    [id]
  );
  return NextResponse.json({ data: result.rows });
}

// POST /api/acoes-formacao/[id]/fotos — registar uma foto já enviada para o storage (bucket "acoes-formacao-fotos")
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (!(await isAcaoManager(sessionUser.id, role, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { label, nome_arquivo } = await req.json();
  if (!nome_arquivo) return NextResponse.json({ error: "nome_arquivo obrigatório" }, { status: 400 });

  const result = await dbQuery(
    `INSERT INTO arquivos (label, nome_arquivo, tipo, area, visibilidade, site_publico, acao_formacao_id, uploader_id)
     VALUES ($1, $2, 'imagem', 'Fotos', 'publico', true, $3, $4)
     RETURNING id, label, nome_arquivo, created_at`,
    [label || nome_arquivo, nome_arquivo, id, sessionUser.id]
  );
  await auditLog("acao_formacao_foto_upload", { actorId: sessionUser.id, targetId: result.rows[0].id, details: { acao_formacao_id: id } });
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/acoes-formacao/[id]/fotos?foto_id=... — remover uma foto desta acção
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  if (!(await isAcaoManager(sessionUser.id, role, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const fotoId = new URL(req.url).searchParams.get("foto_id");
  if (!fotoId) return NextResponse.json({ error: "foto_id obrigatório" }, { status: 400 });

  await dbQuery(`DELETE FROM arquivos WHERE id = $1 AND acao_formacao_id = $2`, [fotoId, id]);
  await auditLog("acao_formacao_foto_delete", { actorId: sessionUser.id, targetId: fotoId, details: { acao_formacao_id: id } });
  return NextResponse.json({ ok: true });
}
