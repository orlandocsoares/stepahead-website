import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const metadata = body.metadata ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: { message: "Email e password sao obrigatorios." } }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: { message: "A password deve ter pelo menos 6 caracteres." } }, { status: 400 });
    }

    const exists = await dbQuery<{ id: string }>("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [email]);
    if (exists.rows[0]) {
      return NextResponse.json({ error: { message: "Ja existe uma conta com este email." } }, { status: 409 });
    }

    const created = await dbQuery<{ id: string }>(
      "INSERT INTO auth_users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hashPassword(password)]
    );

    const userId = created.rows[0].id;
    const firstName = String(metadata.first_name ?? "").trim();
    const role = String(metadata.role ?? "formando");

    await dbQuery(
      `INSERT INTO profiles (id, email, first_name, role, status)
       VALUES ($1, $2, $3, $4, 'pendente')`,
      [userId, email, firstName || null, role]
    );

    await setSession(userId);

    return NextResponse.json({ data: { user: { id: userId, email } } });
  } catch {
    return NextResponse.json({ error: { message: "Falha ao criar conta." } }, { status: 500 });
  }
}
