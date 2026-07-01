import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

// GET /api/tarefas/migrate — adiciona colunas nota e feedback (corre uma vez)
export async function GET(_req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;
  if (!["super-admin", "formador"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await dbQuery(`ALTER TABLE tarefa_destinatarios ADD COLUMN IF NOT EXISTS nota VARCHAR(20)`, []);
  await dbQuery(`ALTER TABLE tarefa_destinatarios ADD COLUMN IF NOT EXISTS feedback TEXT`, []);
  return NextResponse.json({ ok: true, message: "Colunas nota e feedback adicionadas." });
}
