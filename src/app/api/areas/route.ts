import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const result = await dbQuery(
    `SELECT nome FROM disciplinas WHERE activo = true ORDER BY nome`
  );
  const areas = (result.rows as any[]).map(r => r.nome);
  return NextResponse.json({ areas });
}
