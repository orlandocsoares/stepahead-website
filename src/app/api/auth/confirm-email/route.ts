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

    // Notificar todos os formadores que o formando escolheu
    const profile = await dbQuery<{ first_name: string; last_name: string; email: string }>(
      "SELECT first_name, last_name, email FROM profiles WHERE id = $1 LIMIT 1",
      [row.user_id]
    );
    const p = profile.rows[0];
    if (p) {
      const formadores = await dbQuery<{ formador_id: string }>(
        "SELECT formador_id FROM formando_formadores WHERE formando_id = $1 AND status = 'pendente'",
        [row.user_id]
      );
      for (const { formador_id } of formadores.rows) {
        await dbQuery(
          `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
           VALUES ($1, 'novo_formando', 'Novo formando aguarda aprovação',
             $2, '/dashboard/admin')`,
          [formador_id, `${p.first_name} ${p.last_name} (${p.email}) confirmou o email e escolheu-te como formador.`]
        );
      }
    }

    return redirect("/confirm-email?sucesso=1");
  } catch {
    return redirect("/confirm-email?erro=server");
  }
}
