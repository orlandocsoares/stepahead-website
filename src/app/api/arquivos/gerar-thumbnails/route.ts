import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

// POST /api/arquivos/gerar-thumbnails
// Devolve a lista de ficheiros PDF sem thumbnail para o cliente gerar e guardar
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["admin", "super-admin"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const result = await dbQuery(`
    SELECT id, nome_arquivo
    FROM arquivos
    WHERE thumbnail_url IS NULL
      AND (nome_arquivo ILIKE '%.pdf' OR tipo = 'pdf')
    ORDER BY created_at DESC
  `);

  return NextResponse.json({ ficheiros: result.rows });
}

// PATCH /api/arquivos/gerar-thumbnails — guardar thumbnail_url gerado pelo cliente
export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id, thumbnail_url } = await req.json();
  if (!id || !thumbnail_url) return NextResponse.json({ error: "Campos em falta" }, { status: 400 });

  await dbQuery(`UPDATE arquivos SET thumbnail_url = $1 WHERE id = $2`, [thumbnail_url, id]);
  return NextResponse.json({ ok: true });
}
