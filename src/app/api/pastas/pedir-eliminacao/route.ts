import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

// POST /api/pastas/pedir-eliminacao — quem não é dono nem admin pede a quem
// criou a pasta que a elimine. Cria uma notificação com link directo à pasta.
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { pastaId } = await req.json();
  if (!pastaId) return NextResponse.json({ error: "pastaId obrigatório." }, { status: 400 });

  const pastaRes = await dbQuery(
    `SELECT p.id, p.nome, p.area, p.criado_por, s.first_name, s.last_name
     FROM pastas p
     LEFT JOIN profiles s ON s.id = $2
     WHERE p.id = $1`,
    [pastaId, session.id]
  );
  const pasta = pastaRes.rows[0];
  if (!pasta) return NextResponse.json({ error: "Pasta não encontrada." }, { status: 404 });
  if (!pasta.criado_por) return NextResponse.json({ error: "Esta pasta não tem dono definido." }, { status: 400 });
  if (pasta.criado_por === session.id) return NextResponse.json({ error: "Já és o dono desta pasta." }, { status: 400 });

  const solicitanteNome = `${pasta.first_name ?? ""} ${pasta.last_name ?? ""}`.trim() || "Um utilizador";
  const link = `/dashboard/ficheiros?area=${encodeURIComponent(pasta.area)}&eliminarPasta=${pasta.id}`;

  await dbQuery(
    `INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link)
     VALUES ($1, 'pasta_eliminar', 'Pedido para eliminar pasta', $2, $3)`,
    [pasta.criado_por, `${solicitanteNome} pediu para eliminares a pasta "${pasta.nome}" (${pasta.area}).`, link]
  );

  return NextResponse.json({ ok: true });
}
