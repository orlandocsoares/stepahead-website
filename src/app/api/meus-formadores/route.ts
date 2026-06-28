import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

/** Valida formato "AAAA/AAAA" com anos consecutivos, ex: "2025/2026" */
function validarAnoLetivo(ano: string): boolean {
  const match = ano.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return false;
  return parseInt(match[2]) === parseInt(match[1]) + 1;
}

// GET — lista de formadores do formando com status por ano letivo
export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth()+1;
  const defaultAno = m >= 9 ? `${y}/${y+1}` : `${y-1}/${y}`;
  const anoParam = new URL(req.url).searchParams.get("ano") || defaultAno;

  // Rejeitar anos letivos malformados
  if (!validarAnoLetivo(anoParam)) {
    return NextResponse.json({ error: "Ano letivo inválido." }, { status: 400 });
  }
  const anoLetivo = anoParam;

  const result = await dbQuery(`
    SELECT ff.id, ff.formador_id, ff.status, ff.ano_letivo,
           p.first_name, p.last_name, p.specialization AS especialidade, p.avatar_url, p.provincia
    FROM formando_formadores ff
    JOIN profiles p ON p.id = ff.formador_id
    WHERE ff.formando_id = $1 AND ff.ano_letivo = $2
    ORDER BY ff.created_at ASC
  `, [session.id, anoLetivo]);

  // Apenas formadores com conta activa (aprovados pelo admin)
  const todos = await dbQuery(`
    SELECT id, first_name, last_name, specialization AS especialidade, avatar_url, provincia
    FROM profiles
    WHERE role = 'formador' AND status = 'activo'
    ORDER BY first_name ASC
  `);

  return NextResponse.json({ associacoes: result.rows, formadores: todos.rows });
}

// POST — adicionar formador (cria associação pendente + notificação)
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const formador_id = body.formador_id;
  const now2 = new Date(); const y2 = now2.getFullYear(); const m2 = now2.getMonth()+1;
  const ano_letivo = body.ano_letivo || (m2 >= 9 ? `${y2}/${y2+1}` : `${y2-1}/${y2}`);
  if (!formador_id) return NextResponse.json({ error: "formador_id obrigatório" }, { status: 400 });
  if (!validarAnoLetivo(ano_letivo)) return NextResponse.json({ error: "Ano letivo inválido." }, { status: 400 });

  // Verificar se já existe
  const exists = await dbQuery(
    "SELECT id FROM formando_formadores WHERE formando_id = $1 AND formador_id = $2 AND ano_letivo = $3",
    [session.id, formador_id, ano_letivo]
  );
  if (exists.rows[0]) return NextResponse.json({ error: "Já associado a este formador neste ano letivo" }, { status: 409 });

  await dbQuery(
    `INSERT INTO formando_formadores (formando_id, formador_id, status, ano_letivo) VALUES ($1, $2, 'pendente', $3)`,
    [session.id, formador_id, ano_letivo]
  );

  // Notificar o formador
  const me = await dbQuery("SELECT first_name, last_name, email FROM profiles WHERE id = $1 LIMIT 1", [session.id]);
  const p = me.rows[0];
  if (p) {
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
       VALUES ($1, 'novo_formando', 'Novo formando escolheu-te', $2, '/dashboard/admin')`,
      [formador_id, `${p.first_name} ${p.last_name} (${p.email}) adicionou-te como formador para ${ano_letivo}.`]
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE — remover associação (notifica formador)
export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body2 = await req.json();
  const formador_id = body2.formador_id;
  const now3 = new Date(); const y3 = now3.getFullYear(); const m3 = now3.getMonth()+1;
  const ano_letivo = body2.ano_letivo || (m3 >= 9 ? `${y3}/${y3+1}` : `${y3-1}/${y3}`);
  if (!validarAnoLetivo(ano_letivo)) return NextResponse.json({ error: "Ano letivo inválido." }, { status: 400 });

  const deleted = await dbQuery(
    `DELETE FROM formando_formadores WHERE formando_id = $1 AND formador_id = $2 AND ano_letivo = $3 RETURNING *`,
    [session.id, formador_id, ano_letivo]
  );
  if (!deleted.rows[0]) return NextResponse.json({ error: "Associação não encontrada" }, { status: 404 });

  // Notificar o formador
  const me = await dbQuery("SELECT first_name, last_name, email FROM profiles WHERE id = $1 LIMIT 1", [session.id]);
  const p = me.rows[0];
  if (p) {
    await dbQuery(
      `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
       VALUES ($1, 'formando_removeu', 'Formando removeu associação', $2, '/dashboard/admin')`,
      [formador_id, `${p.first_name} ${p.last_name} removeu-te da sua lista de formadores para ${ano_letivo}.`]
    );
  }

  return NextResponse.json({ ok: true });
}
