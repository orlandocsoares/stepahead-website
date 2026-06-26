import { NextResponse } from "next/server";
import { Resend } from "resend";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, role, provincia, escola, especialidade, biografia, avatar_url } = body;

    if (!email || !role) return NextResponse.json({ error: "Email e role obrigatórios" }, { status: 400 });

    const clean = String(email).trim().toLowerCase();

    // Criar auth_user se não existir
    const existing = await dbQuery<{ id: string }>(
      "SELECT id FROM auth_users WHERE email = $1 LIMIT 1",
      [clean]
    );

    let userId: string;
    let isNewUser = false;
    const passwordHash = hashPassword(password || randomBytes(16).toString("hex"));

    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      // Actualizar password real se foi fornecida
      if (password) {
        await dbQuery("UPDATE auth_users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
      }
    } else {
      const created = await dbQuery<{ id: string }>(
        `INSERT INTO auth_users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [clean, passwordHash]
      );
      userId = created.rows[0].id;
      isNewUser = true;
    }

    // Criar ou actualizar profiles
    await dbQuery(
      `INSERT INTO profiles (id, email, first_name, last_name, role, status, provincia, escola, especialidade, biografia, avatar_url)
       VALUES ($1,$2,$3,$4,$5,'pendente',$6,$7,$8,$9,$10)
       ON CONFLICT (email) DO UPDATE SET
         role          = EXCLUDED.role,
         first_name    = COALESCE(EXCLUDED.first_name,    profiles.first_name),
         last_name     = COALESCE(EXCLUDED.last_name,     profiles.last_name),
         provincia     = COALESCE(EXCLUDED.provincia,     profiles.provincia),
         escola        = COALESCE(EXCLUDED.escola,        profiles.escola),
         especialidade = COALESCE(EXCLUDED.especialidade, profiles.especialidade),
         biografia     = COALESCE(EXCLUDED.biografia,     profiles.biografia),
         avatar_url    = COALESCE(EXCLUDED.avatar_url,    profiles.avatar_url)`,
      [userId, clean, first_name || null, last_name || null, role,
       provincia || null, escola || null, especialidade || null, biografia || null, avatar_url || null]
    );

    // Enviar email de confirmação (novo utilizador OU re-envio se ainda pendente)
    const needsConfirmation = await dbQuery<{ status: string }>(
      "SELECT status FROM profiles WHERE id = $1 LIMIT 1",
      [userId]
    );
    const profileStatus = needsConfirmation.rows[0]?.status;

    if (profileStatus === 'pendente') {
      let emailSent = false;
      let emailError: string | null = null;

      try {
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await dbQuery(
          `INSERT INTO email_confirm_tokens (token, user_id, expires_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET token = $1, expires_at = $3`,
          [token, userId, expires.toISOString()]
        );

        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sabermais.edu.ao"}/api/auth/confirm-email?token=${token}`;

        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurado no servidor");

        const resend = new Resend(process.env.RESEND_API_KEY);
        const result = await resend.emails.send({
          from: "SaberMais <notificacoes@sabermais.edu.ao>",
          to: clean,
          subject: "Confirme o seu email — SaberMais",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d14;color:#fff;border-radius:16px;">
              <img src="https://sabermais.edu.ao/logo-sabermais.png" alt="SaberMais" style="height:48px;margin-bottom:24px;" />
              <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">Confirme o seu email</h2>
              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:8px;">
                Obrigado por se registar no Portal SaberMais${first_name ? `, <strong style="color:#fff;">${first_name}</strong>` : ""}.
              </p>
              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:24px;">
                Clique no botão abaixo para confirmar o seu email. O link é válido durante <strong style="color:#fff;">24 horas</strong>.
                Após a confirmação, a sua conta ficará a aguardar aprovação pelo administrador.
              </p>
              <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Confirmar email
              </a>
              <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">
                Se não criou esta conta, ignore este email.
              </p>
            </div>
          `,
        });

        if ((result as any).error) throw new Error(JSON.stringify((result as any).error));
        emailSent = true;
      } catch (emailErr: any) {
        emailError = emailErr?.message ?? String(emailErr);
        console.error("Erro ao enviar email de confirmação:", emailError);
      }

      return NextResponse.json({ ok: true, emailSent, emailError });
    }

    return NextResponse.json({ ok: true, emailSent: false, emailError: "status não é pendente" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
