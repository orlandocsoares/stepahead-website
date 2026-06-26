import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !["admin", "super-admin"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { media_radar } = await request.json();
  if (typeof media_radar !== "number" || media_radar < 0 || media_radar > 100) {
    return NextResponse.json({ error: "Valor inválido (0–100)" }, { status: 400 });
  }

  await dbQuery(
    `UPDATE hero_telemetria SET media_radar = $1, updated_at = NOW()`,
    [media_radar]
  );

  return NextResponse.json({ ok: true });
}
