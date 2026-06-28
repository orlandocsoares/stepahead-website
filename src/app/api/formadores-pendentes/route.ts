import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["admin", "super-admin"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const result = await dbQuery(`
    SELECT p.id, p.first_name, p.last_name, p.email, p.especialidade, p.biografia, p.provincia, p.created_at
    FROM profiles p
    WHERE p.role = 'formador' AND p.status = 'pendente'
    ORDER BY p.created_at DESC
  `);

  return NextResponse.json({ formadores: result.rows });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["admin", "super-admin"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { formador_id, acao } = await req.json();
  if (!formador_id || !["aprovar", "rejeitar"].includes(acao)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  if (acao === "aprovar") {
    await dbQuery(`UPDATE profiles SET status = 'activo' WHERE id = $1 AND role = 'formador'`, [formador_id]);
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
       VALUES ($1, 'aprovacao', 'Conta aprovada!',
         'A sua conta de formador foi aprovada. Pode agora iniciar sessão no portal SaberMais.', '/')`,
      [formador_id]
    );
    await auditLog("approve_formador", { actorId: session.id, targetId: formador_id, ip });
  } else {
    await dbQuery(`UPDATE profiles SET status = 'rejeitado' WHERE id = $1 AND role = 'formador'`, [formador_id]);
    await auditLog("reject_formador", { actorId: session.id, targetId: formador_id, ip });
  }

  return NextResponse.json({ ok: true });
}
