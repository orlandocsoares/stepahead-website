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

      // Formandos só podem contactar os seus formadores aceites, coordenadores ou administradores.
      if (role === "formando" && recipientIds.length > 0) {
        const recipRes = await dbQuery(`SELECT id, role FROM profiles WHERE id = ANY($1)`, [recipientIds]);
        const naoFormandos = recipRes.rows.filter((r: any) => r.role !== "formando");
        if (naoFormandos.length < recipRes.rows.length) {
          return NextResponse.json({ error: "Formandos só podem enviar mensagens a formadores, coordenadores ou administradores." }, { status: 403 });
        }
        const formadorIds = naoFormandos.filter((r: any) => r.role === "formador").map((r: any) => r.id);
        if (formadorIds.length > 0) {
          const assocRes = await dbQuery(
            `SELECT DISTINCT af.formador_id FROM acao_formadores af
             INNER JOIN inscricoes_acao ia ON ia.acao_formacao_id = af.acao_formacao_id
             WHERE ia.formando_id = $1 AND ia.status = 'inscrito' AND af.formador_id = ANY($2)`,
            [session.id, formadorIds]
          );
          const aceitesIds = new Set(assocRes.rows.map((r: any) => r.formador_id));
          if (formadorIds.some((id: string) => !aceitesIds.has(id))) {
            return NextResponse.json({ error: "Só podes enviar mensagens aos formadores das tuas acções de formação." }, { status: 403 });
          }
        }
      }
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

    // Aviso agregado — só para quem ainda não tem um por ler (ver /api/mensagens POST)
    const semAviso = await db.query(
      `SELECT id FROM profiles p WHERE p.id = ANY($1)
       AND NOT EXISTS (SELECT 1 FROM notificacoes n WHERE n.user_id = p.id AND n.tipo = 'mensagem' AND n.lida = FALSE)`,
      [recipientIds]
    );
    if (semAviso.rows.length > 0) {
      const notifValues = semAviso.rows
        .map((_: any, i: number) => `($${i + 1}, 'mensagem', 'Novas mensagens', 'Tens mensagens por ler.', '/dashboard/mensagens')`)
        .join(", ");
      await db.query(
        `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link) VALUES ${notifValues}`,
        semAviso.rows.map((r: any) => r.id)
      );
    }

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
