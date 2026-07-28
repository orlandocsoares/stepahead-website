import { Resend } from "resend";
import { dbQuery } from "@/lib/db";
import { randomBytes } from "crypto";

const BASE = process.env.APP_URL || "https://sabermais.edu.ao";

// Prazo de validade do link de confirmação de email.
export const CONFIRM_EMAIL_TTL_MS = 48 * 60 * 60 * 1000; // 48h

export async function sendConfirmEmail(email: string, userId: string, firstName: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + CONFIRM_EMAIL_TTL_MS);

  await dbQuery(
    `INSERT INTO email_confirm_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $1, expires_at = $3`,
    [token, userId, expires.toISOString()]
  );

  const confirmUrl = `${BASE}/api/auth/confirm-email?token=${token}`;

  await resend.emails.send({
    from: "SaberMais <notificacoes@sabermais.edu.ao>",
    to: email,
    subject: "Confirme o seu email — SaberMais",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d14;color:#fff;border-radius:16px;">
        <img src="${BASE}/logo-sabermais.png" alt="SaberMais" style="height:48px;margin-bottom:24px;" />
        <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">Bem-vindo ao SaberMais${firstName ? `, ${firstName}` : ""}!</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:24px;">
          Para activar a sua conta, clique no botão abaixo para confirmar o seu endereço de email. O link é válido durante <strong style="color:#fff;">48 horas</strong>.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Confirmar email
        </a>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">
          Se não criou esta conta, pode ignorar este email.
        </p>
      </div>
    `,
  });
}
