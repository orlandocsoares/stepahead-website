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
    topContrib,
    eventosRecentes,
    usersByRoleRows,
    // Admin-only deep stats
    crescimentoMensal,
    utilizadoresInativos,
    ticketsPorCategoria,
    ficheirosPorVisibilidade,
    ficheirosPorTipo,
    eventosPorTipo,
    comunidadeStats,
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
      SELECT p.first_name, p.last_name, p.role, COUNT(a.id) AS total
      FROM arquivos a
      JOIN profiles p ON p.id = a.uploader_id
      GROUP BY p.id, p.first_name, p.last_name, p.role
      ORDER BY total DESC LIMIT 5
    `),

    // Top áreas por nº de ficheiros
    dbQuery(`
      SELECT area, COUNT(*) AS total
      FROM arquivos
      WHERE area IS NOT NULL AND area != ''
      GROUP BY area ORDER BY total DESC LIMIT 6
    `),

    // Mais activos (uploads + posts)
    dbQuery(`
      SELECT p.first_name, p.last_name, p.role,
        (SELECT COUNT(*) FROM arquivos WHERE uploader_id = p.id) +
        (SELECT COUNT(*) FROM comunidade_posts WHERE user_id = p.id) AS contribuicoes
      FROM profiles p
      WHERE p.role IN ('formador', 'formando')
      ORDER BY contribuicoes DESC LIMIT 5
    `),

    // Próximos eventos
    dbQuery(`
      SELECT titulo, local, data_evento, tipo
      FROM agenda_atividades
      WHERE data_evento >= NOW()
      ORDER BY data_evento ASC LIMIT 5
    `),

    // Distribuição por cargo
    dbQuery(`SELECT role, COUNT(*) AS total FROM profiles GROUP BY role`),

    // Crescimento mensal de registos (últimos 6 meses)
    dbQuery(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS mes,
        DATE_TRUNC('month', created_at) AS mes_date,
        COUNT(*) AS total
      FROM profiles
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY mes_date, mes
      ORDER BY mes_date ASC
    `),

    // Utilizadores inativos (sem uploads nem posts)
    dbQuery(`
      SELECT p.first_name, p.last_name, p.role, p.created_at
      FROM profiles p
      WHERE p.role IN ('formador', 'formando')
        AND NOT EXISTS (SELECT 1 FROM arquivos WHERE uploader_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM comunidade_posts WHERE user_id = p.id)
      ORDER BY p.created_at DESC
      LIMIT 10
    `),

    // Tickets por categoria
    dbQuery(`
      SELECT category, COUNT(*) AS total,
        SUM(CASE WHEN status = 'Resolvido' THEN 1 ELSE 0 END) AS resolvidos
      FROM tickets
      GROUP BY category ORDER BY total DESC
    `),

    // Ficheiros por visibilidade
    dbQuery(`
      SELECT COALESCE(visibilidade, 'publico') AS visibilidade, COUNT(*) AS total
      FROM arquivos
      GROUP BY visibilidade ORDER BY total DESC
    `),

    // Ficheiros por tipo (extensão)
    dbQuery(`
      SELECT
        LOWER(SPLIT_PART(REVERSE(SPLIT_PART(REVERSE(COALESCE(url, label, '')), '.', 1)), '.', 1)) AS extensao,
        COUNT(*) AS total
      FROM arquivos
      GROUP BY extensao ORDER BY total DESC LIMIT 8
    `),

    // Eventos por tipo e formato
    dbQuery(`
      SELECT
        tipo,
        SUM(CASE WHEN local = 'Online' THEN 1 ELSE 0 END) AS online,
        SUM(CASE WHEN local != 'Online' THEN 1 ELSE 0 END) AS presencial,
        COUNT(*) AS total
      FROM agenda_atividades
      GROUP BY tipo
    `),

    // Comunidade: posts sem comentários, média de comentários
    dbQuery(`
      SELECT
        COUNT(DISTINCT cp.id) AS total_posts,
        COUNT(cc.id) AS total_comentarios,
        ROUND(AVG(sub.n_comentarios), 1) AS media_comentarios,
        SUM(CASE WHEN sub.n_comentarios = 0 THEN 1 ELSE 0 END) AS posts_sem_resposta
      FROM comunidade_posts cp
      LEFT JOIN comunidade_comentarios cc ON cc.post_id = cp.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS n_comentarios FROM comunidade_comentarios GROUP BY post_id
      ) sub ON sub.post_id = cp.id
    `),
  ]);

  const usersByRole: Record<string, number> = {};
  for (const r of usersByRoleRows.rows) usersByRole[r.role] = Number(r.total);

  return NextResponse.json({
    // Dashboard data
    totals: totals.rows[0] ?? {},
    topUploaders: topUploaders.rows,
    topAreas: topAreas.rows,
    recentLogins: topContrib.rows,
    eventosRecentes: eventosRecentes.rows,
    usersByRole,
    // Admin-only deep stats
    crescimentoMensal: crescimentoMensal.rows,
    utilizadoresInativos: utilizadoresInativos.rows,
    ticketsPorCategoria: ticketsPorCategoria.rows,
    ficheirosPorVisibilidade: ficheirosPorVisibilidade.rows,
    ficheirosPorTipo: ficheirosPorTipo.rows,
    eventosPorTipo: eventosPorTipo.rows,
    comunidadeStats: comunidadeStats.rows[0] ?? {},
  });
}
