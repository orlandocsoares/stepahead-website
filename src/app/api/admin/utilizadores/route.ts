import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const profileRes = await dbQuery(
    `SELECT role FROM profiles WHERE id = $1 LIMIT 1`,
    [sessionUser.id]
  );
  const me = profileRes.rows[0];
  if (!me) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 403 });

  const isAdmin = me.role === "admin" || me.role === "super-admin";
  const isFormador = me.role === "formador";

  if (!isAdmin && !isFormador) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (isAdmin) {
    // Admin vê todos os utilizadores
    const result = await dbQuery(`
      SELECT p.*, f.first_name || ' ' || COALESCE(f.last_name, '') AS formador_nome
      FROM profiles p
      LEFT JOIN profiles f ON f.id = p.formador_id
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json({ data: result.rows });
  } else {
    // Formador vê os seus formandos agrupados por status de associação
    const result = await dbQuery(`
      SELECT p.*, ff.status AS ff_status, ff.ano_letivo, ff.id AS ff_id
      FROM formando_formadores ff
      JOIN profiles p ON p.id = ff.formando_id
      WHERE ff.formador_id = $1
      ORDER BY
        CASE ff.status
          WHEN 'pendente' THEN 1
          WHEN 'aceite' THEN 2
          WHEN 'rejeitado' THEN 3
          WHEN 'removido' THEN 4
          ELSE 5
        END,
        ff.updated_at DESC
    `, [sessionUser.id]);
    return NextResponse.json({ data: result.rows });
  }
}
