import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getSessionUser } from "@/lib/server-auth";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Sessao expirada." } }, { status: 401 });
  }

  const body = await request.json();
  const password = String(body.password ?? "");
  if (password.length < 6) {
    return NextResponse.json({ error: { message: "A password deve ter pelo menos 6 caracteres." } }, { status: 400 });
  }

  await dbQuery(
    "UPDATE auth_users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
    [hashPassword(password), user.id]
  );

  return NextResponse.json({ data: { success: true } });
}
