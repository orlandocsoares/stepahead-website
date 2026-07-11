import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

const PROVINCIAS_PROGRAMA = ["Bié", "Luanda"];

export async function GET() {
  const safe = (p: Promise<any>) => p.catch(() => ({ rows: [] }));

  const data = await Promise.all(
    PROVINCIAS_PROGRAMA.map(async (nome) => {
      const [acoes, formadores, recursos] = await Promise.all([
        safe(dbQuery(
          `SELECT id, designacao, data_inicio, data_fim, estado
           FROM acoes_formacao
           WHERE LOWER(TRIM(provincia)) = LOWER($1)
           ORDER BY data_inicio DESC NULLS LAST`,
          [nome]
        )),
        safe(dbQuery(
          `SELECT DISTINCT p.id, p.first_name, p.last_name, p.avatar_url, p.specialization AS especialidade
           FROM acao_formadores afo
           JOIN acoes_formacao af ON af.id = afo.acao_formacao_id
           JOIN profiles p ON p.id = afo.formador_id
           WHERE LOWER(TRIM(af.provincia)) = LOWER($1)
           ORDER BY p.first_name ASC`,
          [nome]
        )),
        safe(dbQuery(
          `SELECT DISTINCT a.id, a.label, a.area
           FROM arquivo_acoes_formacao l
           JOIN acoes_formacao af ON af.id = l.acao_formacao_id
           JOIN arquivos a ON a.id = l.arquivo_id
           WHERE LOWER(TRIM(af.provincia)) = LOWER($1) AND a.visibilidade = 'publico'
           ORDER BY a.label ASC`,
          [nome]
        )),
      ]);

      return {
        nome,
        total_acoes: acoes.rows.length,
        acoes: acoes.rows,
        total_formadores: formadores.rows.length,
        formadores: formadores.rows,
        total_recursos: recursos.rows.length,
        recursos: recursos.rows,
      };
    })
  );

  return NextResponse.json({ provincias: data });
}
