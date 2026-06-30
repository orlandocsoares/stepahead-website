import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";
import { auditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// GET /api/tarefas/[id] — detalhes + lista de entregas (formador)
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;

  if (role === "formando") {
    const res = await dbQuery(
      `SELECT t.id, t.titulo, t.descricao, t.prazo, t.created_at,
              t.anexo_url, t.anexo_nome,
              p.first_name AS criador_nome, p.last_name AS criador_apelido,
              td.estado, td.entregue_at, td.resposta_url, td.resposta_nome
       FROM tarefa_destinatarios td
       JOIN tarefas t ON t.id = td.tarefa_id
       JOIN profiles p ON p.id = t.criador_id
       WHERE td.tarefa_id = $1 AND td.formando_id = $2`,
      [id, sessionUser.id]
    );
    if (!res.rows.length) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    return NextResponse.json({ tarefa: res.rows[0] });
  }

  // Formador/admin — ver entregas
  const tarefaRes = await dbQuery(
    `SELECT t.*, COUNT(td.formando_id) AS total,
            COUNT(td.formando_id) FILTER (WHERE td.estado != 'pendente') AS entregues
     FROM tarefas t
     LEFT JOIN tarefa_destinatarios td ON td.tarefa_id = t.id
     WHERE t.id = $1 AND t.criador_id = $2
     GROUP BY t.id`,
    [id, sessionUser.id]
  );
  if (!tarefaRes.rows.length) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const entregasRes = await dbQuery(
    `SELECT p.id, p.first_name, p.last_name, p.email, td.estado, td.entregue_at,
            td.resposta_url, td.resposta_nome
     FROM tarefa_destinatarios td
     JOIN profiles p ON p.id = td.formando_id
     WHERE td.tarefa_id = $1
     ORDER BY td.estado ASC, p.first_name ASC`,
    [id]
  );

  return NextResponse.json({ tarefa: tarefaRes.rows[0], entregas: entregasRes.rows });
}

// PATCH /api/tarefas/[id] — formando marca entregue | formador avalia
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;
  const body = await request.json();

  if (role === "formando") {
    const estado = body.estado === "pendente" ? "pendente" : "entregue";
    const resposta_url = body.resposta_url ?? null;
    const resposta_nome = body.resposta_nome ?? null;
    const res = await dbQuery(
      `UPDATE tarefa_destinatarios
       SET estado = $1, entregue_at = $2, resposta_url = $3, resposta_nome = $4
       WHERE tarefa_id = $5 AND formando_id = $6
       RETURNING estado`,
      [
        estado,
        estado === "entregue" ? new Date().toISOString() : null,
        estado === "entregue" ? resposta_url : null,
        estado === "entregue" ? resposta_nome : null,
        id,
        sessionUser.id,
      ]
    );
    if (!res.rows.length) return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
    await auditLog("tarefa_status_change", { actorId: sessionUser.id, targetId: id, details: { estado } });
    return NextResponse.json({ estado: res.rows[0].estado });
  }

  // Formador/admin — marcar avaliado para um formando específico
  const { formando_id, estado } = body;
  if (!formando_id || !["entregue", "avaliado", "pendente"].includes(estado)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const owns = await dbQuery(`SELECT id FROM tarefas WHERE id = $1 AND criador_id = $2`, [id, sessionUser.id]);
  if (!owns.rows.length) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  await dbQuery(
    `UPDATE tarefa_destinatarios SET estado = $1 WHERE tarefa_id = $2 AND formando_id = $3`,
    [estado, id, formando_id]
  );
  return NextResponse.json({ ok: true });
}

// DELETE /api/tarefas/[id] — apagar tarefa (criador)
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const res = await dbQuery(
    `DELETE FROM tarefas WHERE id = $1 AND criador_id = $2 RETURNING id`,
    [id, sessionUser.id]
  );
  if (!res.rows.length) return NextResponse.json({ error: "Sem permissão ou não encontrado." }, { status: 403 });
  await auditLog("tarefa_delete", { actorId: sessionUser.id, targetId: id });
  return NextResponse.json({ ok: true });
}
