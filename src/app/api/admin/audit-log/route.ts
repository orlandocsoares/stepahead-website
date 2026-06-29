import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
  const role = profileRes.rows[0]?.role;
  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const url = new URL(request.url);
  const actor = url.searchParams.get("actor") ?? "";
  const action = url.searchParams.get("action") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (actor) { conditions.push(`al.actor_id = $${idx++}`); params.push(actor); }
  if (action) { conditions.push(`al.action = $${idx++}`); params.push(action); }
  if (from) { conditions.push(`al.created_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`al.created_at <= $${idx++}`); params.push(to + "T23:59:59"); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows, countRes] = await Promise.all([
    dbQuery(
      `SELECT al.*,
              actor.first_name AS actor_nome, actor.last_name AS actor_apelido, actor.role AS actor_role,
              target.first_name AS target_nome, target.last_name AS target_apelido
       FROM audit_logs al
       LEFT JOIN profiles actor ON actor.id = al.actor_id
       LEFT JOIN profiles target ON target.id = al.target_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    dbQuery(`SELECT COUNT(*) FROM audit_logs al ${where}`, params),
  ]);

  return NextResponse.json({
    data: rows.rows,
    total: parseInt(countRes.rows[0]?.count ?? "0"),
    page,
    pages: Math.ceil(parseInt(countRes.rows[0]?.count ?? "0") / limit),
  });
}
