import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

// GET — caixa de entrada genérica: formandos que confirmaram o email e aguardam
// aprovação de acesso. Qualquer formador ou admin pode ver e aprovar — não há
// (nem deve haver) associação a um formador específico nesta etapa; essa
// associação só existe, mais tarde, através da inscrição numa acção de formação.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ formandos: [] });

  const result = await dbQuery(
    `SELECT id, first_name, last_name, email, escola, provincia, created_at
     FROM profiles
     WHERE role = 'formando' AND status = 'email_confirmado'
     ORDER BY created_at ASC`
  );
  return NextResponse.json({ formandos: result.rows });
}

// POST — aprovar (activa a conta) ou recusar (bloqueia, só admin) um registo
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { formando_id, acao } = await request.json(); // acao: "aprovar" | "recusar"

  const alvo = await dbQuery(
    `SELECT email, first_name, status FROM profiles WHERE id = $1 AND role = 'formando' LIMIT 1`,
    [formando_id]
  );
  if (!alvo.rows[0]) return NextResponse.json({ error: "Formando não encontrado" }, { status: 404 });
  if (alvo.rows[0].status !== "email_confirmado") {
    return NextResponse.json({ error: "Este formando já não está pendente" }, { status: 400 });
  }

  if (acao === "aprovar") {
    await dbQuery(`UPDATE profiles SET status = 'activo' WHERE id = $1`, [formando_id]);
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
       VALUES ($1, 'aprovacao', 'Conta aprovada!',
         'A tua conta foi aprovada. Já podes iniciar sessão e inscrever-te em acções de formação.', '/')`,
      [formando_id]
    );
    await auditLog("approve_formando", { actorId: session.id, targetId: formando_id, ip });
    return NextResponse.json({ ok: true });
  }

  if (acao === "recusar") {
    if (!isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    await dbQuery(`UPDATE profiles SET status = 'rejeitado' WHERE id = $1`, [formando_id]);
    await auditLog("reject_formando", { actorId: session.id, targetId: formando_id, ip });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acção inválida" }, { status: 400 });
}
