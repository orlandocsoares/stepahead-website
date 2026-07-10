import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;
  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { user_id, new_password } = await request.json();
  if (!user_id || !new_password || new_password.length < 6) {
    return NextResponse.json({ error: "ID e nova password (mín. 6 caracteres) são obrigatórios." }, { status: 400 });
  }

  const passwordHash = hashPassword(new_password);
  const result = await dbQuery(
    `UPDATE auth_users SET password_hash = $1 WHERE id = $2 RETURNING id`,
    [passwordHash, user_id]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  // A password foi definida por um administrador — obriga o utilizador a trocá-la no próximo login.
  await dbQuery(`UPDATE profiles SET must_change_password = true WHERE id = $1`, [user_id]);

  await auditLog("reset_password", { actorId: sessionUser.id, targetId: user_id });
  return NextResponse.json({ ok: true });
}
