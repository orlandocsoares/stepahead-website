import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

// GET /api/recursos/pdf/[id] — serve PDF público sem Content-Disposition: attachment
// Rota pública mas só funciona para arquivos com site_publico=true
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
  const absolute = path.join(STORAGE_ROOT, "materiais", nomeArquivo);

  if (!absolute.startsWith(path.join(STORAGE_ROOT, "materiais"))) {
    return new NextResponse("Caminho inválido.", { status: 400 });
  }

  try {
    const data = await readFile(absolute);
    return new NextResponse(data, {
      headers: {
        "content-type": "application/pdf",
        // inline = o browser abre no viewer, não descarrega
        "content-disposition": "inline",
        // Impede que seja carregado noutros sites (embedding externo)
        "x-frame-options": "SAMEORIGIN",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Ficheiro não encontrado.", { status: 404 });
  }
}
