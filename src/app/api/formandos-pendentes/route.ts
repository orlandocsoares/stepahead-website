import { NextResponse } from "next/server";
import { Resend } from "resend";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const BASE = process.env.APP_URL || "https://sabermais.edu.ao";

async function sendApprovalEmail(to: string, firstName: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "SaberMais <notificacoes@sabermais.edu.ao>",
    to,
    subject: "Conta aprovada — SaberMais",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d14;color:#fff;border-radius:16px;">
        <img src="${BASE}/logo-sabermais.png" alt="SaberMais" style="height:48px;margin-bottom:24px;" />
        <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">Conta aprovada${firstName ? `, ${firstName}` : ""}!</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:24px;">
          O seu formador aprovou o acesso ao portal SaberMais. Já pode iniciar sessão e aceder a todos os conteúdos.
        </p>
        <a href="${BASE}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Entrar no portal
        </a>
      </div>
    `,
  }).catch(e => console.error("[formandos-pendentes] sendApprovalEmail error:", e.message));
}

// GET — formador vê os seus formandos pendentes; admin vê todos
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ formandos: [] });

  // Pendentes "normais" (já escolheram um formador, à espera da aprovação dele)
  // + formandos "por reclamar" (confirmaram o email mas nunca chegaram a escolher
  // ninguém — sem isto ficavam invisíveis para sempre, sem admin a monitorizar).
  const result = await dbQuery(
    isAdmin
      ? `SELECT p.id, p.first_name, p.last_name, p.email, p.escola, p.provincia, p.status, p.created_at,
               ff.formador_id, ff.ano_letivo, ff.status AS ff_status,
               f.first_name || ' ' || COALESCE(f.last_name,'') AS formador_nome
         FROM formando_formadores ff
         JOIN profiles p ON p.id = ff.formando_id
         JOIN profiles f ON f.id = ff.formador_id
         WHERE ff.status = 'pendente' AND p.status = 'email_confirmado'
         UNION ALL
         SELECT p.id, p.first_name, p.last_name, p.email, p.escola, p.provincia, p.status, p.created_at,
                NULL, NULL, 'sem_associacao', NULL
         FROM profiles p
         WHERE p.role = 'formando' AND p.status = 'email_confirmado'
           AND NOT EXISTS (SELECT 1 FROM formando_formadores ff2 WHERE ff2.formando_id = p.id)
         ORDER BY created_at DESC`
      : `SELECT p.id, p.first_name, p.last_name, p.email, p.escola, p.provincia, p.status, p.created_at,
               ff.ano_letivo, ff.status AS ff_status
         FROM formando_formadores ff
         JOIN profiles p ON p.id = ff.formando_id
         WHERE ff.formador_id = $1 AND ff.status = 'pendente' AND p.status = 'email_confirmado'
         UNION ALL
         SELECT p.id, p.first_name, p.last_name, p.email, p.escola, p.provincia, p.status, p.created_at,
                NULL, 'sem_associacao'
         FROM profiles p
         WHERE p.role = 'formando' AND p.status = 'email_confirmado'
           AND NOT EXISTS (SELECT 1 FROM formando_formadores ff2 WHERE ff2.formando_id = p.id)
         ORDER BY created_at DESC`,
    isAdmin ? [] : [session.id]
  );

  return NextResponse.json({ formandos: result.rows });
}

// POST — aprovar ou rejeitar a associação formando↔formador
export async function POST(request: Request, ) {
  const ip = getClientIp(request);
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isFormador && !isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { formando_id, acao } = await request.json(); // acao: "associar" | "aprovar" | "rejeitar" | "remover"

  // Formador associa-se a um formando sem associação prévia
  if (acao === "associar") {
    if (!isFormador && !isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    const formadorId = session.id;
    await dbQuery(
      `INSERT INTO formando_formadores (formando_id, formador_id, status, ano_letivo)
       VALUES ($1, $2, 'aceite', (SELECT ano_letivo FROM anos_letivos WHERE activo = true LIMIT 1))
       ON CONFLICT (formando_id, formador_id) DO UPDATE SET status = 'aceite', updated_at = NOW()`,
      [formando_id, formadorId]
    );
    const formadorProfile = await dbQuery(`SELECT first_name, last_name FROM profiles WHERE id = $1 LIMIT 1`, [formadorId]);
    const fp = formadorProfile.rows[0];

    // Se ainda não tinha acesso (primeiro formador a reclamá-lo), dá-lhe acesso agora.
    const activated = await dbQuery(
      "UPDATE profiles SET status = 'activo' WHERE id = $1 AND status = 'email_confirmado' RETURNING email, first_name",
      [formando_id]
    );
    if (activated.rows[0]) {
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'aprovacao', 'Conta aprovada!',
           'O seu formador aprovou o acesso ao portal SaberMais. Pode agora iniciar sessão.', '/')`,
        [formando_id]
      );
      await sendApprovalEmail(activated.rows[0].email, activated.rows[0].first_name);
    } else {
      // Já tinha acesso — apenas avisar que ganhou mais um formador.
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'nova_disciplina', 'Novo formador associado', $2, '/dashboard/perfil')`,
        [formando_id, `${fp?.first_name} ${fp?.last_name} associou-te como seu formando.`]
      );
    }

    // Adicionar à turma do formador se existir
    const turma = await dbQuery("SELECT id FROM turmas WHERE formador_id = $1 LIMIT 1", [formadorId]);
    if (turma.rows[0]) {
      await dbQuery(
        `INSERT INTO turma_membros (turma_id, formando_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [turma.rows[0].id, formando_id]
      );
    }
    await auditLog("associate_formando", { actorId: session.id, targetId: formando_id, ip });
    return NextResponse.json({ ok: true });
  }

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
      // Notificação in-app + email ao formando
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'aprovacao', 'Conta aprovada!',
           'O seu formador aprovou o acesso ao portal SaberMais. Pode agora iniciar sessão.', '/')`,
        [formando_id]
      );
      await sendApprovalEmail(ff.email, ff.first_name);
      await auditLog("approve_formando", { actorId: session.id, targetId: formando_id, ip });
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
    await auditLog("reject_formando", { actorId: session.id, targetId: formando_id, ip });
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
