import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";
import { Resend } from "resend";
import { auditLog } from "@/lib/audit";

const APP_URL = process.env.APP_URL ?? "https://sabermais.edu.ao";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const adminProfile = await dbQuery(`SELECT role, first_name FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = adminProfile.rows[0]?.role;
  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { titulo, mensagem, destinatarios, enviarEmail } = await request.json();
  if (!titulo?.trim() || !mensagem?.trim()) {
    return NextResponse.json({ error: "Título e mensagem são obrigatórios." }, { status: 400 });
  }

  // Determinar utilizadores destino (incluindo o próprio admin)
  let whereRole = "";
  if (destinatarios === "formadores") whereRole = `AND role = 'formador'`;
  else if (destinatarios === "formandos") whereRole = `AND role = 'formando'`;

  const users = await dbQuery(
    `SELECT id, email, first_name FROM profiles WHERE status = 'activo' ${whereRole}`,
    []
  );

  if (!users.rows.length) {
    return NextResponse.json({ enviados: 0, emails: 0 });
  }

  // Inserir notificações com parâmetros separados para evitar injecção SQL
  for (const u of users.rows as any[]) {
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem) VALUES ($1, 'anuncio', $2, $3)`,
      [u.id, titulo.trim(), mensagem.trim()]
    );
  }

  // Enviar emails se pedido
  let emailsEnviados = 0;
  if (enviarEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailHtml = (nome: string) => `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0d0d14;color:#fff;border-radius:16px;">
        <img src="https://sabermais.edu.ao/storage/v1/object/public/logo-sabermais/logo-sabermais.png" alt="SaberMais" style="height:40px;margin-bottom:24px;" />
        <p style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Novidade da plataforma</p>
        <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">${titulo}</h2>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0;">${mensagem.replace(/\n/g, "<br/>")}</p>
        </div>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-bottom:20px;">Olá, <strong style="color:#fff;">${nome}</strong>. Esta mensagem foi enviada pelo administrador da plataforma Saber Mais.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Ir para a plataforma
        </a>
        <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:28px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
          Programa de Apoio ao Reforço do Ensino Secundário em Angola · <a href="${APP_URL}" style="color:rgba(255,255,255,0.3);">sabermais.edu.ao</a>
        </p>
      </div>
    `;

    for (const u of users.rows) {
      if (!u.email) continue;
      try {
        await resend.emails.send({
          from: "SaberMais <notificacoes@sabermais.edu.ao>",
          to: u.email,
          subject: `[Saber Mais] ${titulo}`,
          html: emailHtml(u.first_name ?? "Utilizador"),
        });
        emailsEnviados++;
      } catch (err) {
        console.error("[anuncios] email falhou para", u.email, err);
      }
    }
  }

  await auditLog("anuncio_create", {
    actorId: sessionUser.id,
    details: { titulo: titulo.trim(), destinatarios, enviados: users.rows.length },
  });
  return NextResponse.json({ enviados: users.rows.length, emails: emailsEnviados });
}
