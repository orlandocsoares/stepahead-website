import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { sendConfirmEmail } from "@/lib/email-confirm";

// Máx. 3 reenvios por IP a cada 15 min — evita abuso do envio de emails.
const RESEND_LIMIT = { max: 3, windowMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimiter.check("resend-confirm-email", ip, RESEND_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: `Demasiados pedidos. Tente novamente em ${rl.retryAfterSecs}s.` } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSecs) } }
    );
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: { message: "Email é obrigatório." } }, { status: 400 });
    }

    const found = await dbQuery<{ id: string; first_name: string | null; status: string }>(
      "SELECT id, first_name, status FROM profiles WHERE email = $1 LIMIT 1",
      [email]
    );
    const profile = found.rows[0];

    // Resposta genérica sempre que possível, para não revelar se o email existe.
    const genericResponse = NextResponse.json({
      data: { mensagem: "Se existir uma conta pendente com este email, foi enviado um novo link de confirmação." },
    });

    if (!profile || profile.status !== "pendente") {
      return genericResponse;
    }

    await sendConfirmEmail(email, profile.id, profile.first_name ?? "");
    return genericResponse;
  } catch {
    return NextResponse.json({ error: { message: "Falha ao reenviar email." } }, { status: 500 });
  }
}
