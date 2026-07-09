import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

// GET /api/acoes-formacao — lista acções de formação com formação, formadores e nº de inscritos
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const result = await dbQuery(`
    SELECT
      a.id, a.designacao, a.data_inicio, a.data_fim, a.horario, a.local, a.modalidade,
      a.vagas_max, a.estado, a.created_at,
      f.id AS formacao_id, f.nome AS formacao_nome, f.area AS formacao_area,
      COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'inscrito')::int AS total_inscritos,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', p.id, 'nome', p.first_name || ' ' || COALESCE(p.last_name, '')))
          FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS formadores
    FROM acoes_formacao a
    LEFT JOIN formacoes f ON f.id = a.formacao_id
    LEFT JOIN acao_formadores af ON af.acao_formacao_id = a.id
    LEFT JOIN profiles p ON p.id = af.formador_id
    LEFT JOIN inscricoes_acao i ON i.acao_formacao_id = a.id
    GROUP BY a.id, f.id, f.nome, f.area
    ORDER BY a.data_inicio DESC NULLS LAST, a.created_at DESC
  `);

  return NextResponse.json({ data: result.rows });
}

// POST /api/acoes-formacao — criar acção de formação (admin ou formador)
export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const roleRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = roleRes.rows[0]?.role;
  const isAdmin = role === "admin" || role === "super-admin";
  const isFormador = role === "formador";
  if (!isAdmin && !isFormador) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const {
    formacao_id, designacao, data_inicio, data_fim, horario, local,
    modalidade, vagas_max, estado, formador_ids,
  } = await req.json();

  if (!designacao) return NextResponse.json({ error: "Designação obrigatória" }, { status: 400 });

  const result = await dbQuery(
    `INSERT INTO acoes_formacao (formacao_id, designacao, data_inicio, data_fim, horario, local, modalidade, vagas_max, estado)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'presencial'), $8, COALESCE($9, 'agendada'))
     RETURNING *`,
    [formacao_id || null, designacao, data_inicio || null, data_fim || null, horario || null, local || null, modalidade || null, vagas_max || null, estado || null]
  );
  const acao = result.rows[0];

  // Formador que cria fica automaticamente associado; admin pode indicar formador_ids
  const effectiveFormadorIds: string[] = isFormador
    ? [sessionUser.id]
    : Array.isArray(formador_ids) ? formador_ids.filter(Boolean) : [];

  for (const fid of effectiveFormadorIds) {
    await dbQuery(`INSERT INTO acao_formadores (acao_formacao_id, formador_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [acao.id, fid]);
  }

  // A acção aparece automaticamente na Agenda, para que os formandos se possam inscrever
  if (acao.data_inicio) {
    await dbQuery(
      `INSERT INTO agenda_atividades (titulo, local, data_evento, tipo, acao_formacao_id)
       VALUES ($1, $2, $3, 'Restrito', $4)`,
      [designacao, local?.trim() || "A definir", acao.data_inicio, acao.id]
    );
  }

  await auditLog("acao_formacao_create", { actorId: sessionUser.id, targetId: acao.id, details: { designacao } });
  return NextResponse.json({ data: acao });
}
