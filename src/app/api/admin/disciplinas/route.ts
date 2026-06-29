import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

async function requireAdmin() {
  const s = await getSessionUser();
  if (!s) return null;
  const r = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [s.id]);
  const role = r.rows[0]?.role;
  return ["admin", "super-admin"].includes(role) ? s : null;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const res = await dbQuery(`SELECT id, nome, activo, ordem FROM disciplinas ORDER BY ordem ASC, nome ASC`, []);
  return NextResponse.json({ disciplinas: res.rows });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { nome } = await request.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const maxOrdem = await dbQuery(`SELECT COALESCE(MAX(ordem),0)+1 AS next FROM disciplinas`, []);
  const res = await dbQuery(
    `INSERT INTO disciplinas (nome, ordem) VALUES ($1, $2) RETURNING id, nome, activo, ordem`,
    [nome.trim(), maxOrdem.rows[0].next]
  );
  return NextResponse.json({ disciplina: res.rows[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id, activo, nome, ordem } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  const sets: string[] = [];
  const vals: unknown[] = [id];
  if (activo !== undefined) { sets.push(`activo = $${vals.length + 1}`); vals.push(activo); }
  if (nome !== undefined)   { sets.push(`nome   = $${vals.length + 1}`); vals.push(nome.trim()); }
  if (ordem !== undefined)  { sets.push(`ordem  = $${vals.length + 1}`); vals.push(ordem); }
  if (!sets.length) return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  const res = await dbQuery(`UPDATE disciplinas SET ${sets.join(", ")} WHERE id = $1 RETURNING id, nome, activo, ordem`, vals);
  return NextResponse.json({ disciplina: res.rows[0] });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await dbQuery(`DELETE FROM disciplinas WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
