import { NextResponse } from "next/server";
import { Resend } from "resend";
import { dbQuery } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const clean = String(email).trim().toLowerCase();

    // Verificar se o utilizador existe
    const result = await dbQuery<{ id: string; email: string }>(
      "SELECT id, email FROM auth_users WHERE email = $1 LIMIT 1",
      [clean]
    );

    // Responder sempre com sucesso para não revelar se o email existe
    if (!result.rows[0]) {
      return NextResponse.json({ ok: true });
    }

    const user = result.rows[0];
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token na BD
    await dbQuery(
      `INSERT INTO password_reset_tokens (token, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $1, expires_at = $3`,
      [token, user.id, expires.toISOString()]
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sabermais.edu.ao"}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "SaberMais <noreply@sabermais.edu.ao>",
      to: user.email,
      subject: "Recuperação de password — SaberMais",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d14;color:#fff;border-radius:16px;">
          <img src="https://sabermais.edu.ao/logo-sabermais.png" alt="SaberMais" style="height:48px;margin-bottom:24px;" />
          <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">Recuperação de password</h2>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:24px;">
            Recebemos um pedido para repor a password da sua conta. Clique no botão abaixo para definir uma nova password. O link é válido durante <strong style="color:#fff;">1 hora</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
            Redefinir password
          </a>
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">
            Se não solicitou este pedido, ignore este email. A sua password não será alterada.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
