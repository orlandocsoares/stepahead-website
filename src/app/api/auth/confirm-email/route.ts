import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/confirm-email?erro=token_invalido", req.url));

  try {
    const result = await dbQuery<{ user_id: string; expires_at: string }>(
      "SELECT user_id, expires_at FROM email_confirm_tokens WHERE token = $1 LIMIT 1",
      [token]
    );

    const row = result.rows[0];
    if (!row) return NextResponse.redirect(new URL("/confirm-email?erro=token_invalido", req.url));
    if (new Date(row.expires_at) < new Date()) return NextResponse.redirect(new URL("/confirm-email?erro=token_expirado", req.url));

    // Actualizar status para email_confirmado (só se ainda estiver pendente)
    await dbQuery(
      "UPDATE profiles SET status = 'email_confirmado' WHERE id = $1 AND status = 'pendente'",
      [row.user_id]
    );

    // Invalidar token
    await dbQuery("DELETE FROM email_confirm_tokens WHERE user_id = $1", [row.user_id]);

    return NextResponse.redirect(new URL("/confirm-email?sucesso=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/confirm-email?erro=server", req.url));
  }
}
