import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });

  const result = await dbQuery<{ email: string; expires_at: string }>(
    `SELECT u.email, t.expires_at
     FROM password_reset_tokens t
     JOIN auth_users u ON u.id = t.user_id
     WHERE t.token = $1 LIMIT 1`,
    [token]
  );

  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: "Link inválido ou já utilizado" }, { status: 404 });
  if (new Date(row.expires_at) < new Date()) return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 410 });

  // Mascarar email: or***@gmail.com
  const [local, domain] = row.email.split("@");
  const masked = local.slice(0, 2) + "***@" + domain;
  return NextResponse.json({ email: masked });
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: "Token e password obrigatórios" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "A password deve ter pelo menos 6 caracteres" }, { status: 400 });

    // Validar token
    const result = await dbQuery<{ user_id: string; expires_at: string }>(
      "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1 LIMIT 1",
      [token]
    );

    const row = result.rows[0];
    if (!row) return NextResponse.json({ error: "Link inválido ou já utilizado" }, { status: 400 });
    if (new Date(row.expires_at) < new Date()) return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });

    // Actualizar password
    const hash = hashPassword(password);
    await dbQuery("UPDATE auth_users SET password_hash = $1 WHERE id = $2", [hash, row.user_id]);

    // Invalidar token
    await dbQuery("DELETE FROM password_reset_tokens WHERE user_id = $1", [row.user_id]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
