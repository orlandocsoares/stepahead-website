import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

const BASE = process.env.APP_URL || "https://sabermais.edu.ao";

function redirect(path: string) {
  return NextResponse.redirect(`${BASE}${path}`);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirect("/confirm-email?erro=token_invalido");

  try {
    const result = await dbQuery<{ user_id: string; expires_at: string }>(
      "SELECT user_id, expires_at FROM email_confirm_tokens WHERE token = $1 LIMIT 1",
      [token]
    );

    const row = result.rows[0];
    if (!row) return redirect("/confirm-email?erro=token_invalido");
    if (new Date(row.expires_at) < new Date()) return redirect("/confirm-email?erro=token_expirado");

    await dbQuery(
      "UPDATE profiles SET status = 'email_confirmado' WHERE id = $1 AND status = 'pendente'",
      [row.user_id]
    );

    await dbQuery("DELETE FROM email_confirm_tokens WHERE user_id = $1", [row.user_id]);

    // Notificar formador se o formando escolheu um
    const profile = await dbQuery<{ first_name: string; last_name: string; email: string; formador_id: string | null }>(
      "SELECT first_name, last_name, email, formador_id FROM profiles WHERE id = $1 LIMIT 1",
      [row.user_id]
    );
    const p = profile.rows[0];
    if (p?.formador_id) {
      await dbQuery(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
         VALUES ($1, 'novo_formando', 'Novo formando aguarda aprovação',
           $2, '/dashboard/admin')`,
        [p.formador_id, `${p.first_name} ${p.last_name} (${p.email}) confirmou o email e aguarda a sua aprovação.`]
      );
    }

    return redirect("/confirm-email?sucesso=1");
  } catch {
    return redirect("/confirm-email?erro=server");
  }
}
