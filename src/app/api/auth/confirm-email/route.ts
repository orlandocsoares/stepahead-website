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

    const profileRes = await dbQuery<{ first_name: string; last_name: string; email: string; role: string }>(
      "SELECT first_name, last_name, email, role FROM profiles WHERE id = $1 LIMIT 1",
      [row.user_id]
    );
    const p = profileRes.rows[0];

    if (p?.role === "formador") {
      // Formador confirmou email → notificar admins para aprovação
      const admins = await dbQuery<{ id: string }>(
        `SELECT id FROM profiles WHERE role IN ('admin', 'super-admin') AND status = 'activo'`
      );
      for (const admin of admins.rows) {
        await dbQuery(
          `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
           VALUES ($1, 'novo_formador', 'Novo formador aguarda aprovação',
             $2, '/dashboard/admin')`,
          [admin.id, `${p.first_name} ${p.last_name ?? ""} (${p.email}) confirmou o email e aguarda aprovação.`]
        );
      }
      return redirect("/confirm-email?sucesso=formador");
    }

    // Formando: o acesso ao portal só é activado quando a sua primeira inscrição
    // numa acção de formação for aprovada (ver /api/acoes-formacao/[id]/inscricoes).
    // Aqui basta confirmar o email; a pessoa já pode inscrever-se em acções.
    return redirect("/confirm-email?sucesso=1");
  } catch {
    return redirect("/confirm-email?erro=server");
  }
}
