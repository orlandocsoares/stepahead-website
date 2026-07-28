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

// POST /api/pastas/[id]/clonar — clona a pasta e os metadados dos seus ficheiros
// (reaproveitando o mesmo objecto no armazenamento, sem duplicar bytes) para uma
// nova Acção de Formação, já publicados nessa acção.
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id: pastaId } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = roleRes.rows[0]?.role;

  const { acao_formacao_id, nome } = await req.json();
  if (!acao_formacao_id) return NextResponse.json({ error: "acao_formacao_id obrigatório." }, { status: 400 });

  if (!(await isAcaoManager(session.id, role, acao_formacao_id))) {
    return NextResponse.json({ error: "Sem permissão sobre a acção de formação de destino." }, { status: 403 });
  }

  const pastaRes = await dbQuery(`SELECT * FROM pastas WHERE id = $1 LIMIT 1`, [pastaId]);
  const pastaOrigem = pastaRes.rows[0];
  if (!pastaOrigem) return NextResponse.json({ error: "Pasta não encontrada." }, { status: 404 });

  const arquivosOrigem = await dbQuery(`SELECT * FROM arquivos WHERE pasta_id = $1`, [pastaId]);

  const novaPastaRes = await dbQuery(
    `INSERT INTO pastas (nome, area, acao_formacao_id, criado_por) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome?.trim() || pastaOrigem.nome, pastaOrigem.area, acao_formacao_id, session.id]
  );
  const novaPasta = novaPastaRes.rows[0];

  let clonados = 0;
  for (const a of arquivosOrigem.rows) {
    const novoArquivo = await dbQuery(
      `INSERT INTO arquivos (label, nome_arquivo, area, tamanho, tipo, visibilidade, status, destinatario_email, uploader_id, acao_formacao_id, pasta_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [a.label, a.nome_arquivo, a.area, a.tamanho, a.tipo, a.visibilidade, a.status, a.destinatario_email, session.id, acao_formacao_id, novaPasta.id]
    );
    const novoId = novoArquivo.rows[0].id;
    await dbQuery(
      `INSERT INTO arquivo_acoes_formacao (arquivo_id, acao_formacao_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [novoId, acao_formacao_id]
    );
    clonados++;
  }

  await auditLog("pasta_clonar", {
    actorId: session.id,
    targetId: pastaId,
    details: { nova_pasta_id: novaPasta.id, acao_formacao_id, total_ficheiros: clonados },
  });
  return NextResponse.json({ data: novaPasta, total_ficheiros: clonados });
}
