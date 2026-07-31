import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(
    `SELECT role FROM profiles WHERE id = $1 LIMIT 1`,
    [sessionUser.id]
  );
  const me = profileRes.rows[0];
  if (!me) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 403 });

  const isAdmin = me.role === "admin" || me.role === "super-admin";
  const isFormador = me.role === "formador";

  if (!isAdmin && !isFormador) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (isAdmin) {
    // Garantir que as colunas existem (migration segura)
    await dbQuery(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES profiles(id) ON DELETE SET NULL`).catch(() => {});
    await dbQuery(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS formador_id UUID REFERENCES profiles(id) ON DELETE SET NULL`).catch(() => {});

    const result = await dbQuery(`
      SELECT p.*,
        f.first_name || ' ' || COALESCE(f.last_name, '') AS formador_nome,
        c.first_name || ' ' || COALESCE(c.last_name, '') AS criado_por_nome,
        al_login.last_login,
        al_last.last_session_seconds,
        CASE WHEN us.last_seen_at > NOW() - INTERVAL '2 minutes' THEN true ELSE false END AS online_now
      FROM profiles p
      LEFT JOIN profiles f ON f.id = p.formador_id
      LEFT JOIN profiles c ON c.id = p.criado_por
      LEFT JOIN (
        SELECT actor_id, MAX(created_at) AS last_login
        FROM audit_logs WHERE action = 'login_success'
        GROUP BY actor_id
      ) al_login ON al_login.actor_id = p.id
      LEFT JOIN (
        -- Duração apenas da sessão mais recente (não soma sessões antigas).
        -- Se ainda não houver logout correspondente, conta até agora (sessão em curso).
        SELECT DISTINCT ON (l.actor_id)
          l.actor_id,
          EXTRACT(EPOCH FROM (
            COALESCE(
              (SELECT created_at FROM audit_logs
               WHERE actor_id = l.actor_id AND action = 'logout' AND created_at > l.created_at
               ORDER BY created_at ASC LIMIT 1),
              NOW()
            ) - l.created_at
          )) AS last_session_seconds
        FROM audit_logs l
        WHERE l.action = 'login_success'
        ORDER BY l.actor_id, l.created_at DESC
      ) al_last ON al_last.actor_id = p.id
      LEFT JOIN (
        SELECT user_id, MAX(last_seen_at) AS last_seen_at
        FROM user_sessions WHERE expires_at > NOW()
        GROUP BY user_id
      ) us ON us.user_id = p.id
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json({ data: result.rows });
  } else {
    // Formador vê todos os formandos e formadores activos da plataforma (leitura),
    // mas nunca administradores — controlos de gestão continuam reservados a admins no frontend.
    const result = await dbQuery(`
      SELECT p.*,
        al_login.last_login,
        al_last.last_session_seconds,
        CASE WHEN us.last_seen_at > NOW() - INTERVAL '2 minutes' THEN true ELSE false END AS online_now
      FROM profiles p
      LEFT JOIN (
        SELECT actor_id, MAX(created_at) AS last_login
        FROM audit_logs WHERE action = 'login_success'
        GROUP BY actor_id
      ) al_login ON al_login.actor_id = p.id
      LEFT JOIN (
        SELECT DISTINCT ON (l.actor_id)
          l.actor_id,
          EXTRACT(EPOCH FROM (
            COALESCE(
              (SELECT created_at FROM audit_logs
               WHERE actor_id = l.actor_id AND action = 'logout' AND created_at > l.created_at
               ORDER BY created_at ASC LIMIT 1),
              NOW()
            ) - l.created_at
          )) AS last_session_seconds
        FROM audit_logs l
        WHERE l.action = 'login_success'
        ORDER BY l.actor_id, l.created_at DESC
      ) al_last ON al_last.actor_id = p.id
      LEFT JOIN (
        SELECT user_id, MAX(last_seen_at) AS last_seen_at
        FROM user_sessions WHERE expires_at > NOW()
        GROUP BY user_id
      ) us ON us.user_id = p.id
      WHERE p.role IN ('formando', 'formador') AND p.status = 'activo'
      ORDER BY p.first_name ASC, p.last_name ASC
    `);
    return NextResponse.json({ data: result.rows });
  }
}

// DELETE /api/admin/utilizadores?id=... — elimina a conta por completo (admin/super-admin).
// Apaga de auth_users, que cascateia para profiles — ao contrário de apagar só
// "profiles" (via /api/db/profiles), isto não deixa o email preso numa conta
// órfã que depois bloqueia um novo registo com o mesmo email.
export async function DELETE(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const meRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const isAdmin = meRes.rows[0]?.role === "admin" || meRes.rows[0]?.role === "super-admin";
  if (!isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const result = await dbQuery(`DELETE FROM auth_users WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  await auditLog("user_delete", { actorId: sessionUser.id, targetId: id });
  return NextResponse.json({ ok: true });
}
