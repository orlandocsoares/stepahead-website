import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

// GET /api/arquivos/lista — lista ficheiros com grupos de formação incluídos
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const res = await dbQuery(
    `SELECT a.*,
            COALESCE(
              json_agg(ag.grupo_id) FILTER (WHERE ag.grupo_id IS NOT NULL),
              '[]'
            ) AS grupos
     FROM arquivos a
     LEFT JOIN arquivo_grupos ag ON ag.arquivo_id = a.id
     GROUP BY a.id
     ORDER BY a.created_at DESC`,
    []
  );

  return NextResponse.json({ data: res.rows });
}
