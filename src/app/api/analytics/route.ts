import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [
    totals,
    topUploaders,
    topAreas,
    recentLogins,
    eventosRecentes,
    usersByRoleRows,
  ] = await Promise.all([
    // Totais gerais
    dbQuery(`
      SELECT
        (SELECT COUNT(*) FROM profiles) AS total_users,
        (SELECT COUNT(*) FROM profiles WHERE status = 'activo') AS users_activos,
        (SELECT COUNT(*) FROM arquivos) AS total_ficheiros,
        (SELECT COUNT(*) FROM agenda_atividades) AS total_eventos,
        (SELECT COUNT(*) FROM agenda_atividades WHERE data_evento >= NOW() - INTERVAL '30 days') AS eventos_mes,
        (SELECT COUNT(*) FROM comunidade_posts) AS total_posts,
        (SELECT COUNT(*) FROM tickets WHERE status = 'Pendente') AS tickets_pendentes
    `),

    // Top 5 uploaders
    dbQuery(`
      SELECT
        p.first_name, p.last_name, p.role,
        COUNT(a.id) AS total
      FROM arquivos a
      JOIN profiles p ON p.id = a.uploader_id
      GROUP BY p.id, p.first_name, p.last_name, p.role
      ORDER BY total DESC
      LIMIT 5
    `),

    // Top áreas por nº de ficheiros
    dbQuery(`
      SELECT area, COUNT(*) AS total
      FROM arquivos
      WHERE area IS NOT NULL AND area != ''
      GROUP BY area
      ORDER BY total DESC
      LIMIT 6
    `),

    // Utilizadores mais activos por nº de posts + ficheiros
    dbQuery(`
      SELECT p.first_name, p.last_name, p.role,
        (SELECT COUNT(*) FROM arquivos WHERE uploader_id = p.id) +
        (SELECT COUNT(*) FROM comunidade_posts WHERE user_id = p.id) AS contribuicoes
      FROM profiles p
      WHERE p.role IN ('formador', 'formando')
      ORDER BY contribuicoes DESC
      LIMIT 5
    `),

    // Eventos recentes / futuros (próximos 30 dias)
    dbQuery(`
      SELECT titulo, local, data_evento, tipo
      FROM agenda_atividades
      WHERE data_evento >= NOW()
      ORDER BY data_evento ASC
      LIMIT 5
    `),

    // Distribuição por cargo
    dbQuery(`
      SELECT role, COUNT(*) AS total
      FROM profiles
      GROUP BY role
    `),
  ]);

  const usersByRole: Record<string, number> = {};
  for (const r of usersByRoleRows.rows) usersByRole[r.role] = Number(r.total);

  return NextResponse.json({
    totals: totals.rows[0] ?? {},
    topUploaders: topUploaders.rows,
    topAreas: topAreas.rows,
    recentLogins: recentLogins.rows,
    eventosRecentes: eventosRecentes.rows,
    usersByRole,
  });
}
