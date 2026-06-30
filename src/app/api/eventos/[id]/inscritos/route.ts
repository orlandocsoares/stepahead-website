import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/eventos/[id]/inscritos — contagem e lista de inscritos
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  const isStaff = ["admin", "super-admin", "formador"].includes(role);

  // Contagem por papel
  const countRes = await dbQuery(
    `SELECT p.role, COUNT(*) AS total
     FROM inscricoes_agenda ia
     JOIN profiles p ON p.id = ia.user_id
     WHERE ia.evento_id = $1
     GROUP BY p.role`,
    [id]
  );

  const counts: Record<string, number> = {};
  let totalInscritos = 0;
  for (const row of countRes.rows) {
    counts[row.role] = Number(row.total);
    totalInscritos += Number(row.total);
  }

  // Lista completa só para staff
  if (!isStaff) {
    return NextResponse.json({ total: totalInscritos, counts });
  }

  const listRes = await dbQuery(
    `SELECT p.id, p.first_name, p.last_name, p.email, p.role, ia.created_at AS inscrito_em
     FROM inscricoes_agenda ia
     JOIN profiles p ON p.id = ia.user_id
     WHERE ia.evento_id = $1
     ORDER BY ia.created_at ASC`,
    [id]
  );

  return NextResponse.json({ total: totalInscritos, counts, inscritos: listRes.rows });
}
