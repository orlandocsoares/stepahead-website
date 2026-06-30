import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { dbQuery } from "@/lib/db";

// POST /api/admin/migrate — aplica migrações incrementais à BD
// Apenas super-admin pode executar
export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
  const role = profileRes.rows[0]?.role;
  if (role !== "super-admin") {
    return NextResponse.json({ error: "Apenas super-admin pode executar migrações." }, { status: 403 });
  }

  const migrations: { name: string; sql: string }[] = [
    {
      name: "add_criado_por_to_profiles",
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES profiles(id) ON DELETE SET NULL`,
    },
    {
      name: "add_formador_id_to_profiles",
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS formador_id UUID REFERENCES profiles(id) ON DELETE SET NULL`,
    },
  ];

  const results: { name: string; ok: boolean; error?: string }[] = [];
  for (const m of migrations) {
    try {
      await dbQuery(m.sql);
      results.push({ name: m.name, ok: true });
    } catch (e: any) {
      results.push({ name: m.name, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ results });
}
