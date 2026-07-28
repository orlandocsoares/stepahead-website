import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

async function ensureSchema() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS pastas (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      nome              TEXT        NOT NULL,
      area              TEXT        NOT NULL,
      acao_formacao_id  UUID        REFERENCES acoes_formacao(id) ON DELETE SET NULL,
      criado_por        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});
  await dbQuery(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS pasta_id UUID REFERENCES pastas(id) ON DELETE SET NULL`).catch(() => {});
}

// GET /api/pastas — lista pastas, opcionalmente filtradas por área (disciplina)
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSchema();

  const area = req.nextUrl.searchParams.get("area");
  const res = await dbQuery(
    `SELECT p.id, p.nome, p.area, p.acao_formacao_id, p.criado_por, p.created_at,
            af.designacao AS acao_designacao,
            COUNT(a.id)::int AS total_ficheiros
     FROM pastas p
     LEFT JOIN acoes_formacao af ON af.id = p.acao_formacao_id
     LEFT JOIN arquivos a ON a.pasta_id = p.id
     ${area ? "WHERE p.area = $1" : ""}
     GROUP BY p.id, af.designacao
     ORDER BY p.created_at DESC`,
    area ? [area] : []
  );
  return NextResponse.json({ data: res.rows });
}

// POST /api/pastas — criar pasta (formador/admin)
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSchema();

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = roleRes.rows[0]?.role;
  if (!["formador", "admin", "super-admin"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { nome, area, acao_formacao_id } = await req.json();
  if (!nome?.trim() || !area?.trim()) {
    return NextResponse.json({ error: "Nome e área são obrigatórios." }, { status: 400 });
  }

  const res = await dbQuery(
    `INSERT INTO pastas (nome, area, acao_formacao_id, criado_por) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome.trim(), area.trim(), acao_formacao_id || null, session.id]
  );
  await auditLog("pasta_create", { actorId: session.id, targetId: res.rows[0].id, details: { nome: nome.trim(), area: area.trim() } });
  return NextResponse.json({ data: res.rows[0] });
}

// DELETE /api/pastas?id=... — remover pasta (dono ou admin). Os ficheiros dentro
// ficam soltos (pasta_id volta a null) — não são eliminados.
export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = roleRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";

  const result = await dbQuery(
    `DELETE FROM pastas WHERE id = $1 AND ($2::boolean OR criado_por = $3) RETURNING id`,
    [id, isAdmin, session.id]
  );
  if (result.rowCount === 0) return NextResponse.json({ error: "Pasta não encontrada ou sem permissão." }, { status: 404 });

  await auditLog("pasta_delete", { actorId: session.id, targetId: id });
  return NextResponse.json({ ok: true });
}
