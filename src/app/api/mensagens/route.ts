import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// GET /api/mensagens?with=<userId>   → conversa entre o user actual e <userId>
// GET /api/mensagens?unread=1        → contagem de não lidas (para badge)
// GET /api/mensagens?conversations=1 → lista de conversas (última mensagem por interlocutor)
export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(request.url);
    const withUser = url.searchParams.get("with");
    const unread = url.searchParams.get("unread");
    const conversations = url.searchParams.get("conversations");

    if (unread) {
      const result = await db.query(
        `SELECT COUNT(*) AS count FROM mensagens WHERE to_user_id = $1 AND read = FALSE`,
        [session.id]
      );
      return NextResponse.json({ count: parseInt(result.rows[0].count) });
    }

    if (conversations) {
      // Uma linha por interlocutor — a última mensagem trocada
      const result = await db.query(
        `SELECT DISTINCT ON (other_id)
           other_id,
           p.first_name, p.last_name, p.avatar_url, p.role,
           m.content AS last_message,
           m.created_at,
           m.from_user_id,
           -- nº de não lidas desta conversa
           (SELECT COUNT(*) FROM mensagens u
            WHERE u.from_user_id = other_id AND u.to_user_id = $1 AND u.read = FALSE) AS unread_count
         FROM (
           SELECT CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS other_id,
                  id, content, created_at, from_user_id
           FROM mensagens
           WHERE from_user_id = $1 OR to_user_id = $1
         ) m
         JOIN profiles p ON p.id = m.other_id
         ORDER BY other_id, m.created_at DESC`,
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

    return NextResponse.json({ error: "Parâmetro obrigatório em falta" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/mensagens  { to_user_id, content }
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { to_user_id, content } = await request.json();
    if (!to_user_id || !content?.trim()) {
      return NextResponse.json({ error: "Destinatário e conteúdo são obrigatórios" }, { status: 400 });
    }
    if (to_user_id === session.id) {
      return NextResponse.json({ error: "Não podes enviar mensagens para ti próprio" }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO mensagens (from_user_id, to_user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [session.id, to_user_id, content.trim()]
    );
    return NextResponse.json({ data: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
