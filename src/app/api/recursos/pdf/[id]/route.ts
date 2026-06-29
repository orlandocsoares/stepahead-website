import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

// GET /api/recursos/pdf/[id] — redireciona para o URL público do ficheiro no storage
// Só funciona para arquivos com site_publico=true
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const res = await dbQuery(
    `SELECT nome_arquivo FROM arquivos WHERE id = $1 AND site_publico = true AND visibilidade = 'publico' LIMIT 1`,
    [id]
  );

  if (res.rows.length === 0) {
    return new NextResponse("Não encontrado.", { status: 404 });
  }

  const nomeArquivo = res.rows[0].nome_arquivo;
  const publicUrl = `/storage/v1/object/public/materiais/${encodeURIComponent(nomeArquivo)}`;

  return NextResponse.redirect(new URL(publicUrl, _request.url));
}
