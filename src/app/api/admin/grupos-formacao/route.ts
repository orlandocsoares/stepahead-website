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
  const res = await dbQuery(`SELECT id, nome, activo, criado_at FROM grupos_formacao ORDER BY criado_at ASC`, []);
  return NextResponse.json({ grupos: res.rows });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { nome } = await request.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const res = await dbQuery(
    `INSERT INTO grupos_formacao (nome) VALUES ($1) RETURNING id, nome, activo, criado_at`,
    [nome.trim()]
  );
  return NextResponse.json({ grupo: res.rows[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id, activo, nome } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  const sets: string[] = [];
  const vals: unknown[] = [id];
  if (activo !== undefined) { sets.push(`activo = $${vals.length + 1}`); vals.push(activo); }
  if (nome !== undefined)   { sets.push(`nome   = $${vals.length + 1}`); vals.push(nome.trim()); }
  if (!sets.length) return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  const res = await dbQuery(`UPDATE grupos_formacao SET ${sets.join(", ")} WHERE id = $1 RETURNING id, nome, activo, criado_at`, vals);
  return NextResponse.json({ grupo: res.rows[0] });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await dbQuery(`DELETE FROM grupos_formacao WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
