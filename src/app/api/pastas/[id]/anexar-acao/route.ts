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

// POST /api/pastas/[id]/anexar-acao — publica TODOS os ficheiros da pasta numa
// acção de formação de uma só vez (em vez de ficheiro a ficheiro)
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id: pastaId } = await context.params;

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = roleRes.rows[0]?.role;

  const { acao_formacao_id, disponivel_de, disponivel_ate } = await req.json();
  if (!acao_formacao_id) return NextResponse.json({ error: "acao_formacao_id obrigatório." }, { status: 400 });

  if (!(await isAcaoManager(session.id, role, acao_formacao_id))) {
    return NextResponse.json({ error: "Sem permissão sobre esta acção de formação." }, { status: 403 });
  }

  const pastaRes = await dbQuery(`SELECT id FROM pastas WHERE id = $1 LIMIT 1`, [pastaId]);
  if (!pastaRes.rows[0]) return NextResponse.json({ error: "Pasta não encontrada." }, { status: 404 });

  const arquivos = await dbQuery(`SELECT id FROM arquivos WHERE pasta_id = $1`, [pastaId]);
  if (arquivos.rows.length === 0) {
    return NextResponse.json({ error: "Esta pasta não tem ficheiros." }, { status: 400 });
  }

  for (const a of arquivos.rows) {
    await dbQuery(
      `INSERT INTO arquivo_acoes_formacao (arquivo_id, acao_formacao_id, disponivel_de, disponivel_ate)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (arquivo_id, acao_formacao_id) DO UPDATE SET disponivel_de = $3, disponivel_ate = $4`,
      [a.id, acao_formacao_id, disponivel_de || null, disponivel_ate || null]
    );
  }

  await auditLog("pasta_anexar_acao", {
    actorId: session.id,
    targetId: pastaId,
    details: { acao_formacao_id, total_ficheiros: arquivos.rows.length },
  });
  return NextResponse.json({ ok: true, total: arquivos.rows.length });
}
