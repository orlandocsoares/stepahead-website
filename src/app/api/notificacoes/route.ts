import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const result = await dbQuery(
    `SELECT id, tipo, titulo, mensagem, lida, link, created_at
     FROM notificacoes WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [session.id]
  );

  const unread = result.rows.filter((n: any) => !n.lida).length;
  return NextResponse.json({ notificacoes: result.rows, unread });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await request.json();
  if (id) {
    await dbQuery(
      "UPDATE notificacoes SET lida = TRUE WHERE id = $1 AND user_id = $2",
      [id, session.id]
    );
  } else {
    await dbQuery(
      "UPDATE notificacoes SET lida = TRUE WHERE user_id = $1",
      [session.id]
    );
  }
  return NextResponse.json({ ok: true });
}
