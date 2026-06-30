import { NextResponse } from "next/server";
import { db, dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog } from "@/lib/audit";

// POST /api/mensagens/broadcast
// Body: { destinatario: "todos" | "formandos" | "formadores" | "ids", ids?: string[], content: string }
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [session.id]);
    const role = profileRes.rows[0]?.role;

    const { destinatario, ids, content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

    let recipientIds: string[] = [];

    if (destinatario === "ids") {
      // Envio manual para IDs específicos
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Nenhum destinatário seleccionado." }, { status: 400 });
      }
      recipientIds = ids.filter((id: string) => id !== session.id);
    } else {
      // Formadores podem enviar a todos ou à sua turma de formandos
      // Admins podem enviar a todos
      const canSendToAll = role === "admin" || role === "super-admin" || role === "formador";
      if (!canSendToAll) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

      let whereRole = "";
      if (destinatario === "formandos") whereRole = `AND role = 'formando'`;
      else if (destinatario === "formadores") whereRole = `AND role IN ('formador', 'admin', 'super-admin')`;
      else if (destinatario === "todos") whereRole = "";
      else return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });

      const res = await db.query(
        `SELECT id FROM profiles WHERE id != $1 AND status = 'activo' ${whereRole}`,
        [session.id]
      );
      recipientIds = res.rows.map((r: any) => r.id);
    }

    if (recipientIds.length === 0) {
      return NextResponse.json({ error: "Nenhum destinatário encontrado." }, { status: 404 });
    }

    // Fan-out: inserir uma mensagem por destinatário
    const values = recipientIds
      .map((_: string, i: number) => `($1, $${i + 2}, $${recipientIds.length + 2})`)
      .join(", ");
    const params = [session.id, ...recipientIds, content.trim()];
    await db.query(
      `INSERT INTO mensagens (from_user_id, to_user_id, content) VALUES ${values}`,
      params
    );

    await auditLog("mensagem_broadcast", {
      actorId: session.id,
      details: { destinatario, sent: recipientIds.length },
    });
    return NextResponse.json({ ok: true, sent: recipientIds.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
