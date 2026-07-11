import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

function parseArea(raw: string | null): string {
  if (!raw) return "Geral";
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.filter((v: string) => v && !v.includes("@"))[0] ?? "Geral";
  } catch {}
  return raw.includes("@") ? "Geral" : raw;
}

export async function GET() {
  const result = await dbQuery(`
    SELECT id, first_name, last_name, specialization, biografia, avatar_url, provincia
    FROM profiles
    WHERE role = 'formador' AND status IN ('activo', 'email_confirmado')
  `).catch(() => ({ rows: [] }));

  const formadores = (result.rows as any[])
    .map((f) => ({
      id: f.id,
      nome: `${f.first_name ?? ""} ${f.last_name ?? ""}`.trim(),
      area: parseArea(f.specialization),
      biografia: f.biografia ?? null,
      avatar_url: f.avatar_url ?? null,
      provincia: f.provincia ?? null,
    }))
    .sort((a, b) => a.area.localeCompare(b.area, "pt") || a.nome.localeCompare(b.nome, "pt"));

  return NextResponse.json({ formadores });
}
