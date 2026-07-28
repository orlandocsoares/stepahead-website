import { NextResponse } from "next/server";
import { Resend } from "resend";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession, getSessionUser } from "@/lib/server-auth";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { sendConfirmEmail } from "@/lib/email-confirm";

// Máx. 5 registos por IP por hora
const REGISTER_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

/**
 * Valida complexidade de password:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 dígito
 * Evita passwords obviamente fracas sem ser demasiado restritivo.
 */
function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "A password deve ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(pwd)) return "A password deve conter pelo menos uma letra maiúscula.";
  if (!/[0-9]/.test(pwd)) return "A password deve conter pelo menos um número.";
  return null; // válida
}

const BASE = process.env.APP_URL || "https://sabermais.edu.ao";

async function notifyAdminNewFormador(firstName: string, lastName: string, email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const admins = await dbQuery<{ email: string }>(
    `SELECT email FROM profiles WHERE role IN ('admin', 'super-admin') AND status = 'activo'`
  );
  for (const admin of admins.rows) {
    await resend.emails.send({
      from: "SaberMais <notificacoes@sabermais.edu.ao>",
      to: admin.email,
      subject: "Novo formador aguarda aprovação — SaberMais",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d14;color:#fff;border-radius:16px;">
          <img src="${BASE}/logo-sabermais.png" alt="SaberMais" style="height:48px;margin-bottom:24px;" />
          <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;">Novo formador aguarda aprovação</h2>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin-bottom:24px;">
            <strong style="color:#fff;">${firstName} ${lastName}</strong> (${email}) confirmou o email e está a aguardar aprovação para aceder ao portal.
          </p>
          <a href="${BASE}/dashboard/admin" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
            Ir para o painel de administração
          </a>
        </div>
      `,
    });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // --- Rate limiting por IP ---
  const rl = rateLimiter.check("register", ip, REGISTER_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: `Demasiados registos. Tente novamente em ${rl.retryAfterSecs}s.` } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const metadata = body.metadata ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: { message: "Email e password sao obrigatorios." } }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({ error: { message: "Email inválido." } }, { status: 400 });
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      return NextResponse.json({ error: { message: pwdError } }, { status: 400 });
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
    // Aceita first_name/last_name/role tanto em metadata (fluxo público) como no topo do corpo
    // (fluxo do admin, dashboard/admin/page.tsx).
    const firstName = String(metadata.first_name ?? body.first_name ?? "").trim();
    const lastName = String(metadata.last_name ?? body.last_name ?? "").trim();
    const requestedRole = String(metadata.role ?? body.role ?? "formando");

    // Segurança: só uma sessão já autenticada como admin/super-admin pode criar contas
    // com papel admin/super-admin. Qualquer outro pedido fica limitado a formando/formador.
    const caller = await getSessionUser();
    const callerRole = caller
      ? (await dbQuery<{ role: string }>(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [caller.id])).rows[0]?.role
      : null;
    const callerIsStaff = callerRole === "admin" || callerRole === "super-admin";

    let role = ["formando", "formador"].includes(requestedRole) ? requestedRole : "formando";
    if (["admin", "super-admin"].includes(requestedRole)) {
      if (!callerIsStaff) {
        return NextResponse.json({ error: { message: "Sem permissão para criar esta conta." } }, { status: 403 });
      }
      role = requestedRole;
    }
    // Contas criadas a partir de uma sessão de staff activa ficam marcadas para obrigar
    // troca de password no primeiro login (a password foi escolhida por outra pessoa).
    const createdByStaff = callerIsStaff;

    await dbQuery(
      `INSERT INTO profiles (id, email, first_name, last_name, role, status, must_change_password)
       VALUES ($1, $2, $3, $4, $5, 'pendente', $6)`,
      [userId, email, firstName || null, lastName || null, role, createdByStaff]
    );

    await auditLog("register", { actorId: userId, ip, details: { role, email } });

    // Ambos os roles: envia email de confirmação — sem sessão imediata
    await sendConfirmEmail(email, userId, firstName).catch(e =>
      console.error("[register] sendConfirmEmail error:", e.message)
    );

    const mensagem = role === "formador"
      ? "Verifique o seu email para confirmar a conta. Após confirmação, a sua conta será analisada pelo administrador."
      : "Verifique o seu email para confirmar a conta.";

    return NextResponse.json({ data: { user: { id: userId, email } }, pendente: true, mensagem });
  } catch {
    return NextResponse.json({ error: { message: "Falha ao criar conta." } }, { status: 500 });
  }
}
