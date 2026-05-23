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

    await setSession(user.id);

    return NextResponse.json({ data: { user: { id: user.id, email: user.email } } });
  } catch {
    return NextResponse.json({ error: { message: "Falha ao autenticar." } }, { status: 500 });
  }
}
