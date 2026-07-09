import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

// GET /api/localidades — lista de províncias com os respectivos municípios (Lei n.º 14/24)
export async function GET() {
  const result = await dbQuery(`
    SELECT p.id, p.nome,
      COALESCE(
        json_agg(jsonb_build_object('id', m.id, 'nome', m.nome) ORDER BY m.nome)
          FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) AS municipios
    FROM provincias p
    LEFT JOIN municipios m ON m.provincia_id = p.id
    GROUP BY p.id, p.nome
    ORDER BY p.nome ASC
  `);
  return NextResponse.json({ data: result.rows });
}
