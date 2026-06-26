import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { setSession } from "@/lib/server-auth";

// Chamado após login Supabase ter sucesso — cria sessão na API própria pelo email.
// Não verifica password (Supabase já o fez).
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const result = await dbQuery<{ id: string; email: string }>(
      "SELECT id, email FROM auth_users WHERE email = $1 LIMIT 1",
      [String(email).trim().toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
