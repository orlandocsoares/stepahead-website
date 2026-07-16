import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

// GET /api/mensagens?with=<userId>   → conversa entre o user actual e <userId>
// GET /api/mensagens?unread=1        → contagem de não lidas (para badge)
// GET /api/mensagens?conversations=1 → lista de conversas (última mensagem por interlocutor)
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(request.url);
    const withUser = url.searchParams.get("with");
    const unread = url.searchParams.get("unread");
    const conversations = url.searchParams.get("conversations");

    if (unread) {
      const result = await db.query(
        `SELECT COUNT(*) AS count, MIN(from_user_id::text) AS first_sender_id
         FROM mensagens WHERE to_user_id = $1 AND read = FALSE`,
        [session.id]
      );
      return NextResponse.json({
        count: parseInt(result.rows[0].count),
        first_sender_id: result.rows[0].first_sender_id ?? null,
      });
    }

    if (conversations) {
      // Query optimizada para evitar o problema "N+1" na contagem de mensagens não lidas.
      // Em vez de uma subquery por linha, pré-calculamos as contagens e fazemos um LEFT JOIN.
      const result = await db.query(
        `SELECT DISTINCT ON (m.other_id)
          m.other_id,
          p.first_name, p.last_name, p.avatar_url, p.role,
          COALESCE(m.content, '📎 ' || m.anexo_nome) AS last_message,
          m.created_at,
          m.from_user_id,
          COALESCE(unread.unread_count, 0)::int AS unread_count
        FROM (
          -- Subquery para identificar o outro utilizador na conversa
          SELECT CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS other_id,
                 id, content, anexo_nome, created_at, from_user_id
          FROM mensagens
          WHERE from_user_id = $1 OR to_user_id = $1
        ) m
        JOIN profiles p ON p.id = m.other_id
        LEFT JOIN (
          -- Subquery para contar mensagens não lidas por utilizador
          SELECT from_user_id, COUNT(*) as unread_count
          FROM mensagens WHERE to_user_id = $1 AND read = FALSE GROUP BY from_user_id
        ) unread ON unread.from_user_id = m.other_id
        ORDER BY m.other_id, m.created_at DESC`,
        [session.id]
      );
      return NextResponse.json({ data: result.rows });
    }

    if (withUser) {
      // Marcar como lidas as mensagens do interlocutor para mim
      await db.query(
        `UPDATE mensagens SET read = TRUE WHERE from_user_id = $1 AND to_user_id = $2 AND read = FALSE`,
        [withUser, session.id]
      );
      const result = await db.query(
        `SELECT m.*,
                p.first_name, p.last_name, p.avatar_url
         FROM mensagens m
         JOIN profiles p ON p.id = m.from_user_id
         WHERE (m.from_user_id = $1 AND m.to_user_id = $2)
            OR (m.from_user_id = $2 AND m.to_user_id = $1)
         ORDER BY m.created_at ASC`,
        [session.id, withUser]
      );
      return NextResponse.json({ data: result.rows });
    }

    return NextResponse.json({ error: "Parâmetro obrigatório em falta (ex: ?with=<userId>)" }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/mensagens  — marcar todas as mensagens recebidas como lidas
export async function PATCH() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await db.query(`UPDATE mensagens SET read = TRUE WHERE to_user_id = $1 AND read = FALSE`, [session.id]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/mensagens?id=<msgId>  — só o remetente pode eliminar
export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID da mensagem obrigatório" }, { status: 400 });

    const result = await db.query(
      `DELETE FROM mensagens WHERE id = $1 AND from_user_id = $2 RETURNING id`,
      [id, session.id]
    );
    if (result.rowCount === 0) return NextResponse.json({ error: "Mensagem não encontrada ou sem permissão" }, { status: 404 });
    await auditLog("mensagem_delete", { actorId: session.id, targetId: id });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/mensagens  { to_user_id, content }
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { to_user_id, content, anexo_url, anexo_nome } = await request.json();
    if (!to_user_id || (!content?.trim() && !anexo_url)) {
      return NextResponse.json({ error: "Destinatário e conteúdo (ou anexo) são obrigatórios" }, { status: 400 });
    }
    if (to_user_id === session.id) {
      return NextResponse.json({ error: "Não podes enviar mensagens para ti próprio" }, { status: 400 });
    }

    const rolesRes = await db.query(
      `SELECT id, role FROM profiles WHERE id IN ($1, $2)`,
      [session.id, to_user_id]
    );
    const senderRole = rolesRes.rows.find((r: any) => r.id === session.id)?.role;
    const recipientRole = rolesRes.rows.find((r: any) => r.id === to_user_id)?.role;
    if (senderRole === "formando") {
      if (recipientRole === "formando") {
        return NextResponse.json({ error: "Formandos só podem enviar mensagens aos seus formadores, coordenadores ou administradores." }, { status: 403 });
      }
      if (recipientRole === "formador") {
        const assoc = await db.query(
          `SELECT 1 FROM acao_formadores af
           INNER JOIN inscricoes_acao ia ON ia.acao_formacao_id = af.acao_formacao_id
           WHERE af.formador_id = $1 AND ia.formando_id = $2 AND ia.status = 'inscrito' LIMIT 1`,
          [to_user_id, session.id]
        );
        if (!assoc.rows[0]) {
          return NextResponse.json({ error: "Só podes enviar mensagens aos formadores das tuas acções de formação." }, { status: 403 });
        }
      }
    }

    const result = await db.query(
      `INSERT INTO mensagens (from_user_id, to_user_id, content, anexo_url, anexo_nome) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [session.id, to_user_id, content?.trim() || null, anexo_url || null, anexo_nome || null]
    );
    // Mensagens privadas não são auditadas — conteúdo pessoal
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
