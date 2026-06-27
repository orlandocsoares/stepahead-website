import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET — formador vê os seus formandos pendentes; admin vê todos
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ formandos: [] });

  const result = await dbQuery(
    isAdmin
      ? `SELECT p.id, p.first_name, p.last_name, p.email, p.escola, p.provincia, p.status,
               ff.formador_id, ff.ano_letivo, ff.status AS ff_status,
               f.first_name || ' ' || COALESCE(f.last_name,'') AS formador_nome
         FROM formando_formadores ff
         JOIN profiles p ON p.id = ff.formando_id
         JOIN profiles f ON f.id = ff.formador_id
         WHERE ff.status = 'pendente' AND p.status = 'email_confirmado'
         ORDER BY ff.created_at DESC`
      : `SELECT p.id, p.first_name, p.last_name, p.email, p.escola, p.provincia, p.status,
               ff.ano_letivo, ff.status AS ff_status
         FROM formando_formadores ff
         JOIN profiles p ON p.id = ff.formando_id
         WHERE ff.formador_id = $1 AND ff.status = 'pendente' AND p.status = 'email_confirmado'
         ORDER BY ff.created_at DESC`,
    isAdmin ? [] : [session.id]
  );

  return NextResponse.json({ formandos: result.rows });
}

// POST — aprovar ou rejeitar a associação formando↔formador
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { formando_id, acao } = await request.json(); // acao: "aprovar" | "rejeitar"

  // Verificar que a associação existe para este formador
  const ffRes = await dbQuery(
    `SELECT ff.*, p.first_name, p.last_name, p.email, p.status AS profile_status
     FROM formando_formadores ff
     JOIN profiles p ON p.id = ff.formando_id
     WHERE ff.formando_id = $1 AND ($2::boolean OR ff.formador_id = $3)
     LIMIT 1`,
    [formando_id, isAdmin, session.id]
  );
  if (!ffRes.rows[0]) return NextResponse.json({ error: "Associação não encontrada" }, { status: 404 });

  const ff = ffRes.rows[0];
  const formadorId = isAdmin ? ff.formador_id : session.id;

  if (acao === "aprovar") {
    // Actualizar estado da associação
    await dbQuery(
      `UPDATE formando_formadores SET status = 'aceite', updated_at = NOW()
       WHERE formando_id = $1 AND formador_id = $2`,
      [formando_id, formadorId]
    );

    // Se ainda não tem acesso, dar acesso agora (primeiro a aprovar)
    if (ff.profile_status === 'email_confirmado') {
      await dbQuery(
        "UPDATE profiles SET status = 'activo' WHERE id = $1 AND status = 'email_confirmado'",
        [formando_id]
      );
      // Notificar o formando que ganhou acesso
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'aprovacao', 'Acesso aprovado!',
           'O seu formador aprovou o acesso ao portal SaberMais. Pode agora iniciar sessão.', '/')`,
        [formando_id]
      );
    } else {
      // Já tinha acesso — notificar que ganhou acesso a nova disciplina
      const formadorProfile = await dbQuery(
        `SELECT first_name, last_name, specialization FROM profiles WHERE id = $1 LIMIT 1`,
        [formadorId]
      );
      const fp = formadorProfile.rows[0];
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'nova_disciplina', 'Nova disciplina desbloqueada',
           $2, '/dashboard/ficheiros')`,
        [formando_id, `${fp?.first_name} ${fp?.last_name} aceitou-te como aluno${fp?.specialization ? ' em ' + fp.specialization : ''}.`]
      );
    }

    // Adicionar à turma do formador se existir
    if (isFormador) {
      const turma = await dbQuery(
        "SELECT id FROM turmas WHERE formador_id = $1 LIMIT 1",
        [formadorId]
      );
      if (turma.rows[0]) {
        await dbQuery(
          `INSERT INTO turma_membros (turma_id, formando_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [turma.rows[0].id, formando_id]
        );
      }
    }
  } else if (acao === "rejeitar") {
    await dbQuery(
      `UPDATE formando_formadores SET status = 'rejeitado', updated_at = NOW()
       WHERE formando_id = $1 AND formador_id = $2`,
      [formando_id, formadorId]
    );
  } else if (acao === "remover") {
    // Formador remove formando já aceite → notifica formando
    await dbQuery(
      `UPDATE formando_formadores SET status = 'removido', updated_at = NOW()
       WHERE formando_id = $1 AND formador_id = $2`,
      [formando_id, formadorId]
    );
    const formadorProfile = await dbQuery(
      `SELECT first_name, last_name, specialization FROM profiles WHERE id = $1 LIMIT 1`,
      [formadorId]
    );
    const fp = formadorProfile.rows[0];
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
       VALUES ($1, 'remocao_formador', 'Associação removida pelo formador', $2, '/dashboard/perfil')`,
      [formando_id, `${fp?.first_name} ${fp?.last_name} removeu-te da sua lista de formandos${fp?.specialization ? ' (' + fp.specialization + ')' : ''}. Perdeste acesso aos conteúdos dessa disciplina.`]
    );
  }

  // Marcar notificação relacionada como lida
  await dbQuery(
    "UPDATE notificacoes SET lida = TRUE WHERE user_id = $1 AND mensagem LIKE $2 AND tipo = 'novo_formando'",
    [formadorId, `%${ff.email}%`]
  );

  return NextResponse.json({ ok: true });
}
