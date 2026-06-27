import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const clean = String(email).trim().toLowerCase();

    const result = await dbQuery<{ id: string; email: string; password_hash: string; status: string }>(
      `SELECT u.id, u.email, u.password_hash, COALESCE(p.status, 'pendente') as status
       FROM auth_users u
       LEFT JOIN profiles p ON p.id = u.id
       WHERE u.email = $1 LIMIT 1`,
      [clean]
    );

    const user = result.rows[0];

    if (password) {
      if (!user || !verifyPassword(String(password), user.password_hash)) {
        return NextResponse.json({ error: "Email ou password incorrectos." }, { status: 401 });
      }
    } else {
      if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    if (user.status === 'pendente') {
      return NextResponse.json({
        error: "Por favor confirme o seu email antes de entrar. Verifique a sua caixa de entrada.",
        code: "EMAIL_NOT_CONFIRMED"
      }, { status: 403 });
    }

    if (user.status === 'email_confirmado') {
      return NextResponse.json({
        error: "A sua conta está a aguardar aprovação pelo administrador. Será notificado quando estiver activa.",
        code: "PENDING_APPROVAL"
      }, { status: 403 });
    }

    if (user.status === 'suspenso') {
      return NextResponse.json({
        error: "A sua conta foi suspensa. Contacte o administrador.",
        code: "SUSPENDED"
      }, { status: 403 });
    }

    // Aceita: activo, aprovado (legado)
    if (!['activo', 'aprovado'].includes(user.status)) {
      return NextResponse.json({ error: "Conta não autorizada.", code: "NOT_AUTHORIZED" }, { status: 403 });
    }

    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
