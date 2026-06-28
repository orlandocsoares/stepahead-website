import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET /api/turmas — lista turmas com formador e contagem de membros
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isAdmin = ["admin", "super-admin"].includes(sessionUser.role ?? "");
  const isFormador = sessionUser.role === "formador";

  const result = await dbQuery(`
    SELECT
      t.id, t.nome, t.area, t.created_at,
      p.first_name || ' ' || COALESCE(p.last_name, '') AS formador_nome,
      p.id AS formador_id,
      COUNT(tm.formando_id)::int AS total_membros
    FROM turmas t
    LEFT JOIN profiles p ON p.id = t.formador_id
    LEFT JOIN turma_membros tm ON tm.turma_id = t.id
    WHERE ($1::boolean OR t.formador_id = $2)
    GROUP BY t.id, p.first_name, p.last_name, p.id
    ORDER BY t.created_at DESC
  `, [isAdmin, sessionUser.id]);

  const semTurma = await dbQuery(`
    SELECT p.id, p.first_name, p.last_name, p.email, p.provincia
    FROM profiles p
    WHERE p.role = 'formando'
      AND p.status IN ('activo', 'email_confirmado', 'pendente')
      AND p.id NOT IN (SELECT formando_id FROM turma_membros)
    ORDER BY p.first_name ASC
  `);

  return NextResponse.json({ data: result.rows, formandos_sem_turma: semTurma.rows });
}

// POST /api/turmas — criar turma (apenas admin)
export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isAdmin && !isFormador) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, area, formador_id } = await req.json();
  if (!nome || !area) return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  // Formador só pode criar turmas para si próprio
  const effectiveFormadorId = isFormador ? sessionUser.id : formador_id;
  if (!effectiveFormadorId) return NextResponse.json({ error: "Formador obrigatório" }, { status: 400 });

  const result = await dbQuery(
    `INSERT INTO turmas (nome, area, formador_id) VALUES ($1, $2, $3) RETURNING *`,
    [nome, area, effectiveFormadorId]
  );
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/turmas?id=... — apagar turma
export async function DELETE(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  await dbQuery(`DELETE FROM turmas WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
