import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

// GET /api/recursos — lista ficheiros marcados como site_publico=true
// Rota pública, sem autenticação
export async function GET() {
  const res = await dbQuery(
    `SELECT a.id, a.label, a.area, a.tamanho, a.created_at, a.thumbnail_url,
            d.nome AS disciplina_nome
     FROM arquivos a
     LEFT JOIN disciplinas d ON d.nome = a.area
     WHERE a.site_publico = true
       AND a.visibilidade = 'publico'
       AND (a.disponivel_de IS NULL OR a.disponivel_de <= NOW())
       AND (a.disponivel_ate IS NULL OR a.disponivel_ate >= NOW())
     ORDER BY a.area, a.created_at DESC`,
    []
  );
  return NextResponse.json({ data: res.rows });
}
