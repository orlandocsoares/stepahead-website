import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

// GET /api/recursos/pdf/[id] — proxy do PDF a partir do Supabase Storage
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

  const nomeArquivo = res.rows[0].nome_arquivo as string;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return new NextResponse("Configuração em falta.", { status: 500 });
  }

  const fileUrl = `${supabaseUrl}/storage/v1/object/public/materiais/${encodeURIComponent(nomeArquivo)}`;

  try {
    const upstream = await fetch(fileUrl);
    if (!upstream.ok) {
      return new NextResponse("Ficheiro não encontrado.", { status: 404 });
    }
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Erro ao carregar o documento.", { status: 500 });
  }
}
