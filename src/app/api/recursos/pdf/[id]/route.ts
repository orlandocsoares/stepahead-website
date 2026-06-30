import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

// GET /api/recursos/pdf/[id] — lê o PDF directamente do disco e serve ao browser
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
  const filePath = path.join(process.cwd(), "storage", "materiais", nomeArquivo);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Ficheiro não encontrado no servidor.", { status: 404 });
  }
}
