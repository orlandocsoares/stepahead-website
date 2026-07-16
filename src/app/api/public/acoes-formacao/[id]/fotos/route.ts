import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

// GET /api/public/acoes-formacao/[id]/fotos — galeria pública de fotos desta acção
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const result = await dbQuery(
    `SELECT id, label, nome_arquivo
     FROM arquivos
     WHERE acao_formacao_id = $1 AND tipo = 'imagem' AND site_publico = true
     ORDER BY created_at ASC`,
    [id]
  );

  const fotos = result.rows.map((f: any) => ({
    id: f.id,
    label: f.label,
    url: `/storage/v1/object/public/acoes-formacao-fotos/${encodeURIComponent(f.nome_arquivo)}`,
  }));

  return NextResponse.json({ data: fotos });
}
