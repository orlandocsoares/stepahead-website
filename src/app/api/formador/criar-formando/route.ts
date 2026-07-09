import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function generateUsername(firstName: string, lastName: string): string {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos
      .replace(/[^a-z0-9]/g, "");
  return `${normalize(firstName)}.${normalize(lastName)}`;
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const callerProfile = await dbQuery(
    `SELECT role FROM profiles WHERE id = $1 LIMIT 1`,
    [sessionUser.id]
  );
  const callerRole = callerProfile.rows[0]?.role;
  if (!["formador", "admin", "super-admin"].includes(callerRole)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { first_name, last_name, email, password, username: customUsername } = await request.json();

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: "Nome e apelido são obrigatórios." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const emailClean = email?.trim().toLowerCase() || null;

  if (emailClean) {
    const existing = await dbQuery(`SELECT id FROM auth_users WHERE email = $1 LIMIT 1`, [emailClean]);
    if (existing.rows.length) {
      return NextResponse.json({ error: "Já existe um utilizador com este email." }, { status: 409 });
    }
  }

  // Se o admin forneceu um username personalizado, verificar se já existe (sem auto-incremento)
  let username: string;
  if (customUsername?.trim()) {
    const taken = await dbQuery(`SELECT id FROM auth_users WHERE username = $1 LIMIT 1`, [customUsername.trim()]);
    if (taken.rows.length) {
      return NextResponse.json({ error: "Nome de utilizador já existe.", code: "USERNAME_TAKEN" }, { status: 409 });
    }
    username = customUsername.trim();
  } else {
    // Auto-gerar e garantir unicidade com sufixo numérico
    let base = generateUsername(first_name.trim(), last_name.trim());
    username = base;
    let suffix = 1;
    while (true) {
      const exists = await dbQuery(`SELECT id FROM auth_users WHERE username = $1 LIMIT 1`, [username]);
      if (!exists.rows.length) break;
      username = `${base}${suffix++}`;
    }
  }

  const passwordHash = hashPassword(password);

  // Criar em auth_users
  const authRes = await dbQuery(
    `INSERT INTO auth_users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id`,
    [emailClean, passwordHash, username]
  );
  const userId = authRes.rows[0].id;

  // Criar perfil — sem professor/turma associado. Sem email → activo imediatamente (pronto a inscrever-se
  // numa Acção de Formação); com email → pendente (fluxo normal de confirmação).
  const status = emailClean ? "pendente" : "activo";
  await dbQuery(
    `INSERT INTO profiles (id, email, first_name, last_name, role, status, criado_por)
     VALUES ($1, $2, $3, $4, 'formando', $5, $6)`,
    [userId, emailClean, first_name.trim(), last_name.trim(), status, sessionUser.id]
  );

  return NextResponse.json({ username, status, userId });
}
