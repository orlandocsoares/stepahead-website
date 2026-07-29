import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/server-auth";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

// Máx. 10 tentativas de login por IP em 15 minutos
const LOGIN_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // --- Rate limiting por IP ---
  const rl = rateLimiter.check("login", ip, LOGIN_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: `Demasiadas tentativas. Tente novamente em ${rl.retryAfterSecs}s.` } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  try {
    const body = await request.json();
    const identifier = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json({ error: { message: "Email/utilizador e password sao obrigatorios." } }, { status: 400 });
    }

    // Aceita email ou username
    const isEmail = identifier.includes("@");
    const result = await dbQuery<{ id: string; email: string; password_hash: string }>(
      isEmail
        ? "SELECT id, email, password_hash FROM auth_users WHERE email = $1 LIMIT 1"
        : "SELECT id, email, password_hash FROM auth_users WHERE username = $1 LIMIT 1",
      [identifier]
    );

    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      await auditLog("login_fail", { ip, details: { identifier } });
      // Mensagem deliberadamente genérica — não revelar se o email existe
      return NextResponse.json({ error: { message: "Credenciais invalidas." } }, { status: 401 });
    }

    // --- Verificações de estado da conta ---
    const profileRes = await dbQuery<{ role: string; status: string }>(
      "SELECT role, status FROM profiles WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const profile = profileRes.rows[0];

    if (profile?.status === "pendente") {
      return NextResponse.json(
        { error: { message: "Confirme o seu email antes de iniciar sessão. Verifique a sua caixa de entrada." } },
        { status: 403 }
      );
    }
    if (profile?.role === "formador" && profile?.status === "email_confirmado") {
      return NextResponse.json(
        { error: { message: "A sua conta está a aguardar aprovação pelo administrador." } },
        { status: 403 }
      );
    }
    if (profile?.role === "formando" && profile?.status === "email_confirmado") {
      return NextResponse.json(
        { error: { message: "A sua conta está a aguardar aprovação pelo seu formador." } },
        { status: 403 }
      );
    }
    if (profile?.status === "rejeitado") {
      return NextResponse.json(
        { error: { message: "A sua conta foi rejeitada. Contacte o administrador." } },
        { status: 403 }
      );
    }

    await setSession(user.id);
    await auditLog("login_success", { actorId: user.id, ip });

    return NextResponse.json({ data: { user: { id: user.id, email: user.email, role: profile?.role } } });
  } catch {
    return NextResponse.json({ error: { message: "Falha ao autenticar." } }, { status: 500 });
  }
}
