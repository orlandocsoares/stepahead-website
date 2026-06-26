import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// Listar formandos pendentes do formador
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isAdmin = ["admin", "super-admin"].includes(session.role ?? "");
  const isFormador = session.role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ formandos: [] });

  const result = await dbQuery(
    `SELECT id, first_name, last_name, email, escola, provincia, created_at
     FROM profiles
     WHERE role = 'formando'
       AND status = 'email_confirmado'
       AND ($1::boolean OR formador_id = $2)
     ORDER BY created_at DESC`,
    [isAdmin, session.id]
  );

  return NextResponse.json({ formandos: result.rows });
}

// Aprovar ou rejeitar formando
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isAdmin = ["admin", "super-admin"].includes(session.role ?? "");
  const isFormador = session.role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { formando_id, acao } = await request.json(); // acao: "aprovar" | "rejeitar"

  // Verificar que o formando pertence a este formador (ou é admin)
  const check = await dbQuery(
    "SELECT id, first_name, last_name, email FROM profiles WHERE id = $1 AND ($2::boolean OR formador_id = $3) LIMIT 1",
    [formando_id, isAdmin, session.id]
  );
  if (!check.rows[0]) return NextResponse.json({ error: "Formando não encontrado" }, { status: 404 });

  const formando = check.rows[0];

  if (acao === "aprovar") {
    await dbQuery(
      "UPDATE profiles SET status = 'activo' WHERE id = $1",
      [formando_id]
    );
    // Notificar o formando
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
       VALUES ($1, 'aprovacao', 'Conta aprovada!', 'O seu formador aprovou o acesso ao portal SaberMais. Pode agora iniciar sessão.', '/')`,
      [formando_id]
    );
    // Adicionar à turma do formador se existir
    if (isFormador) {
      const turma = await dbQuery(
        "SELECT id FROM turmas WHERE formador_id = $1 LIMIT 1",
        [session.id]
      );
      if (turma.rows[0]) {
        await dbQuery(
          `INSERT INTO turma_membros (turma_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [turma.rows[0].id, formando_id]
        );
      }
    }
  } else {
    await dbQuery(
      "UPDATE profiles SET status = 'rejeitado' WHERE id = $1",
      [formando_id]
    );
  }

  // Marcar notificação do formador como lida
  await dbQuery(
    "UPDATE notificacoes SET lida = TRUE WHERE user_id = $1 AND mensagem LIKE $2",
    [session.id, `%${formando.email}%`]
  );

  return NextResponse.json({ ok: true });
}
