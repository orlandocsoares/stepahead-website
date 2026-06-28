import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: { message: "Email e password sao obrigatorios." } }, { status: 400 });
    }

    const result = await dbQuery<{ id: string; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM auth_users WHERE email = $1 LIMIT 1",
      [email]
    );

    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: { message: "Credenciais invalidas." } }, { status: 401 });
    }

    // Verificar se é formador pendente de aprovação
    const profileRes = await dbQuery<{ role: string; status: string }>(
      "SELECT role, status FROM profiles WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const profile = profileRes.rows[0];
    if (profile?.status === "pendente") {
      return NextResponse.json(
        { error: { message: "Confirme o seu email antes de iniciar sessão. Verifique a sua caixa de entrada." } },
        { status: 403 }
      );
    }
    if (profile?.role === "formador" && profile?.status === "email_confirmado") {
      return NextResponse.json(
        { error: { message: "A sua conta está a aguardar aprovação pelo administrador." } },
        { status: 403 }
      );
    }
    if (profile?.role === "formando" && profile?.status === "email_confirmado") {
      return NextResponse.json(
        { error: { message: "A sua conta está a aguardar aprovação pelo seu formador." } },
        { status: 403 }
      );
    }

    await setSession(user.id);

    return NextResponse.json({ data: { user: { id: user.id, email: user.email } } });
  } catch {
    return NextResponse.json({ error: { message: "Falha ao autenticar." } }, { status: 500 });
  }
}
