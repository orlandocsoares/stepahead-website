import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";
import { auditLog } from "@/lib/audit";

// GET /api/tarefas — lista tarefas relevantes para o utilizador
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  // Auto-migração segura
  await dbQuery(`ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS anexo_url TEXT`).catch(() => {});
  await dbQuery(`ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS anexo_nome TEXT`).catch(() => {});
  await dbQuery(`ALTER TABLE tarefa_destinatarios ADD COLUMN IF NOT EXISTS resposta_url TEXT`).catch(() => {});
  await dbQuery(`ALTER TABLE tarefa_destinatarios ADD COLUMN IF NOT EXISTS resposta_nome TEXT`).catch(() => {});
  await dbQuery(`ALTER TABLE tarefa_destinatarios ADD COLUMN IF NOT EXISTS nota VARCHAR(20)`).catch(() => {});
  await dbQuery(`ALTER TABLE tarefa_destinatarios ADD COLUMN IF NOT EXISTS feedback TEXT`).catch(() => {});
  await dbQuery(`ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS acao_formacao_id UUID REFERENCES acoes_formacao(id) ON DELETE SET NULL`).catch(() => {});

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;

  if (role === "formando") {
    const res = await dbQuery(
      `SELECT t.id, t.titulo, t.descricao, t.prazo, t.created_at,
              t.anexo_url, t.anexo_nome, t.acao_formacao_id, af.designacao AS acao_designacao,
              p.first_name AS criador_nome, p.last_name AS criador_apelido,
              td.estado, td.entregue_at, td.resposta_url, td.resposta_nome,
              td.nota, td.feedback
       FROM tarefa_destinatarios td
       JOIN tarefas t ON t.id = td.tarefa_id
       JOIN profiles p ON p.id = t.criador_id
       LEFT JOIN acoes_formacao af ON af.id = t.acao_formacao_id
       WHERE td.formando_id = $1
       ORDER BY t.prazo ASC NULLS LAST, t.created_at DESC`,
      [sessionUser.id]
    );
    return NextResponse.json({ tarefas: res.rows });
  } else {
    const isAdmin = role === "admin" || role === "super-admin";
    const res = await dbQuery(
      `SELECT t.id, t.titulo, t.descricao, t.prazo, t.created_at,
              t.anexo_url, t.anexo_nome, t.acao_formacao_id, af.designacao AS acao_designacao,
              p.first_name AS criador_nome, p.last_name AS criador_apelido,
              COUNT(td.formando_id)                                         AS total,
              COUNT(td.formando_id) FILTER (WHERE td.estado != 'pendente') AS entregues
       FROM tarefas t
       JOIN profiles p ON p.id = t.criador_id
       LEFT JOIN tarefa_destinatarios td ON td.tarefa_id = t.id
       LEFT JOIN acoes_formacao af ON af.id = t.acao_formacao_id
       WHERE ($1::boolean OR t.criador_id = $2)
       GROUP BY t.id, p.first_name, p.last_name, af.designacao
       ORDER BY t.created_at DESC`,
      [isAdmin, sessionUser.id]
    );
    return NextResponse.json({ tarefas: res.rows });
  }
}

// POST /api/tarefas — criar tarefa (formador/admin)
export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;
  if (!["formador", "admin", "super-admin"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { titulo, descricao, prazo, destinatarios, anexo_url, anexo_nome } = await request.json();
  if (!titulo?.trim()) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });

  // Regista a acção de formação associada quando o destino é "acao:<id>" — permite
  // agrupar/identificar tarefas por acção de formação na interface.
  const acaoFormacaoId = typeof destinatarios === "string" && destinatarios.startsWith("acao:")
    ? destinatarios.slice(5)
    : null;

  const tarefaRes = await dbQuery(
    `INSERT INTO tarefas (titulo, descricao, prazo, criador_id, anexo_url, anexo_nome, acao_formacao_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [titulo.trim(), descricao?.trim() || null, prazo || null, sessionUser.id, anexo_url ?? null, anexo_nome ?? null, acaoFormacaoId]
  );
  const tarefaId = tarefaRes.rows[0].id;

  // Determinar formandos destinatários
  let formandoIds: string[] = [];
  if (Array.isArray(destinatarios)) {
    formandoIds = destinatarios;
  } else if (destinatarios === "todos") {
    const res = await dbQuery(`SELECT id FROM profiles WHERE role = 'formando' AND status = 'activo'`, []);
    formandoIds = res.rows.map((r: any) => r.id);
  } else if (typeof destinatarios === "string" && destinatarios.startsWith("acao:")) {
    const acaoId = destinatarios.slice(5);
    const res = await dbQuery(
      `SELECT ia.formando_id AS id FROM inscricoes_acao ia
       JOIN profiles p ON p.id = ia.formando_id
       WHERE ia.acao_formacao_id = $1 AND ia.status = 'inscrito' AND p.status = 'activo'`,
      [acaoId]
    );
    formandoIds = res.rows.map((r: any) => r.id);
  } else if (typeof destinatarios === "string" && destinatarios.startsWith("turma:")) {
    // legado
    const turmaId = destinatarios.slice(6);
    const res = await dbQuery(
      `SELECT tm.formando_id AS id FROM turma_membros tm
       JOIN profiles p ON p.id = tm.formando_id
       WHERE tm.turma_id = $1 AND p.status = 'activo'`,
      [turmaId]
    );
    formandoIds = res.rows.map((r: any) => r.id);
  } else {
    // "meus" — formandos inscritos em acções de formação que este formador lecciona
    const res = await dbQuery(
      `SELECT DISTINCT ia.formando_id AS id
       FROM inscricoes_acao ia
       JOIN acao_formadores af ON af.acao_formacao_id = ia.acao_formacao_id
       JOIN profiles p ON p.id = ia.formando_id
       WHERE af.formador_id = $1 AND ia.status = 'inscrito' AND p.status = 'activo'`,
      [sessionUser.id]
    );
    formandoIds = res.rows.map((r: any) => r.id);
  }

  if (formandoIds.length > 0) {
    const destPlaceholders = formandoIds.map((_, i) => `($1, $${i + 2})`).join(", ");
    await dbQuery(
      `INSERT INTO tarefa_destinatarios (tarefa_id, formando_id) VALUES ${destPlaceholders} ON CONFLICT DO NOTHING`,
      [tarefaId, ...formandoIds]
    );

    const prazoStr = prazo ? ` — prazo: ${new Date(prazo).toLocaleDateString("pt-PT")}` : "";
    const tituloMsg = titulo.trim();
    const mensagemMsg = `Nova tarefa${prazoStr}`;
    const linkMsg = `/dashboard/tarefas?q=${encodeURIComponent(tituloMsg)}`;
    const notifValues: unknown[] = [];
    const notifPlaceholders = formandoIds.map((id, i) => {
      const base = i * 5;
      notifValues.push(id, "tarefa", tituloMsg, mensagemMsg, linkMsg);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(", ");
    await dbQuery(`INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link) VALUES ${notifPlaceholders}`, notifValues);
  }

  await auditLog("tarefa_create", {
    actorId: sessionUser.id,
    targetId: tarefaId,
    details: { titulo: titulo.trim(), destinatarios: String(destinatarios), total: formandoIds.length },
  });
  return NextResponse.json({ id: tarefaId, destinatarios: formandoIds.length });
}
