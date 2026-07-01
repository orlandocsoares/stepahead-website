import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

// GET /api/recursos/pdf/[id] — serve o PDF directamente do disco (sem autenticação)
// Só disponível para ficheiros marcados como site_publico = true
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
  const filePath = path.join(STORAGE_ROOT, "materiais", nomeArquivo);

  // Protecção contra path traversal
  if (!filePath.startsWith(path.join(STORAGE_ROOT, "materiais"))) {
    return new NextResponse("Caminho inválido.", { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = nomeArquivo.toLowerCase().split(".").pop() ?? "";
    const contentType = ext === "pdf" ? "application/pdf"
      : ext === "mp4" ? "video/mp4"
      : "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch {
    return new NextResponse("Ficheiro não encontrado no servidor.", { status: 404 });
  }
}
