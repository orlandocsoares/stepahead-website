import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/server-auth";
import { randomBytes } from "crypto";

// Chamado após registo Supabase — sincroniza o utilizador e perfil na nossa DB.
// Cria auth_user com password temporária se não existir, e actualiza o profiles.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, role, provincia, escola, especialidade, biografia, avatar_url } = body;

    if (!email || !role) return NextResponse.json({ error: "Email e role obrigatórios" }, { status: 400 });

    const clean = String(email).trim().toLowerCase();

    // Criar auth_user se não existir (password temporária — login via Supabase)
    const existing = await dbQuery<{ id: string }>(
      "SELECT id FROM auth_users WHERE email = $1 LIMIT 1",
      [clean]
    );

    let userId: string;
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
    } else {
      const tempPassword = randomBytes(16).toString("hex");
      const created = await dbQuery<{ id: string }>(
        `INSERT INTO auth_users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [clean, hashPassword(tempPassword)]
      );
      userId = created.rows[0].id;
    }

    // Criar ou actualizar profiles com role correcto (conflict em email OU id)
    await dbQuery(
      `INSERT INTO profiles (id, email, first_name, last_name, role, status, provincia, escola, especialidade, biografia, avatar_url)
       VALUES ($1,$2,$3,$4,$5,'pendente',$6,$7,$8,$9,$10)
       ON CONFLICT (email) DO UPDATE SET
         role         = EXCLUDED.role,
         first_name   = COALESCE(EXCLUDED.first_name, profiles.first_name),
         last_name    = COALESCE(EXCLUDED.last_name,  profiles.last_name),
         provincia    = COALESCE(EXCLUDED.provincia,  profiles.provincia),
         escola       = COALESCE(EXCLUDED.escola,     profiles.escola),
         especialidade= COALESCE(EXCLUDED.especialidade, profiles.especialidade),
         biografia    = COALESCE(EXCLUDED.biografia,  profiles.biografia),
         avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url)`,
      [userId, clean, first_name || null, last_name || null, role,
       provincia || null, escola || null, especialidade || null, biografia || null, avatar_url || null]
    );

    await setSession(userId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
