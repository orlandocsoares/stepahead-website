import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !["admin", "super-admin"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { media_radar, formandos_historico_ajuste } = await request.json();

  if (media_radar !== undefined) {
    if (typeof media_radar !== "number" || media_radar < 0 || media_radar > 100) {
      return NextResponse.json({ error: "Valor inválido (0–100)" }, { status: 400 });
    }
    await dbQuery(`UPDATE hero_telemetria SET media_radar = $1, updated_at = NOW()`, [media_radar]);
  }

  if (formandos_historico_ajuste !== undefined) {
    if (typeof formandos_historico_ajuste !== "number" || formandos_historico_ajuste < 0) {
      return NextResponse.json({ error: "Valor inválido (deve ser um número ≥ 0)" }, { status: 400 });
    }
    await dbQuery(`UPDATE hero_telemetria SET formandos_historico_ajuste = $1, updated_at = NOW()`, [formandos_historico_ajuste]);
  }

  return NextResponse.json({ ok: true });
}
