import { NextResponse } from "next/server";
import { assertIdentifier, dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";

const ALLOWED_TABLES = new Set([
  "profiles",
  "hero_telemetria",
  "dashboard_stats",
  "agenda_atividades",
  "inscricoes_agenda",
  "comunidade_posts",
  "tickets",
  "arquivos",
  "documents",
  "turmas",
  "turma_membros",
  "comunidade_comentarios",
  "comunidade_gostos",
  "ticket_mensagens",
]);

function parseTable(params: { table: string }) {
  const table = params.table;
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error("Table not allowed");
  }
  return table;
}

function mapJoinedRows(table: string, rows: any[]) {
  if (table !== "tickets" && table !== "comunidade_posts" && table !== "arquivos") {
    return rows;
  }

  return rows.map((row) => {
    const {
      profile_first_name,
      profile_last_name,
      profile_role,
      profile_avatar_url,
      ...rest
    } = row;

    return {
      ...rest,
      profiles: profile_first_name || profile_last_name || profile_role || profile_avatar_url
        ? {
            first_name: profile_first_name,
            last_name: profile_last_name,
            role: profile_role,
            avatar_url: profile_avatar_url,
          }
        : null,
    };
  });
}

export async function GET(request: Request, context: { params: Promise<{ table: string }> }) {
  try {
    const params = await context.params;
    const table = parseTable(params);
    const tableSql = assertIdentifier(table);
    const url = new URL(request.url);

    // Obter sessão e perfil do utilizador para verificação de segurança
    const sessionUser = await getSessionUser();
    let userRole = "formando";
    let userSpecialization = "";
    
    if (sessionUser) {
      const profileRes = await dbQuery(
        `SELECT role, specialization, especialidade FROM profiles WHERE id = $1 LIMIT 1`,
        [sessionUser.id]
      );
      if (profileRes.rows[0]) {
        userRole = profileRes.rows[0].role || "formando";
        userSpecialization = profileRes.rows[0].specialization || profileRes.rows[0].especialidade || "";
      }
    }

    const filters: string[] = [];
    const values: unknown[] = [];
    let valueIndex = 1;

    // Filtros de segurança para a tabela "arquivos"
    // visibilidade: 'publico' | 'formadores' | 'privado' | 'turma'
    if (table === "arquivos") {
      if (sessionUser) {
        if (userRole !== "super-admin" && userRole !== "admin") {
          if (userRole === "formador") {
            // formador: vê os seus + publico + formadores + turma/formadores_turma das suas turmas
            filters.push(`(
              ${tableSql}.uploader_id = $${valueIndex}
              OR ${tableSql}.visibilidade IN ('publico', 'formadores')
              OR (${tableSql}.visibilidade IN ('turma', 'formadores_turma') AND ${tableSql}.turma_id IN (
                SELECT id FROM turmas WHERE formador_id = $${valueIndex}
              ))
            )`);
            values.push(sessionUser.id);
            valueIndex++;
          } else {
            // formando: vê publico/formadores (área certa), turma propria, formadores_turma se membro
            filters.push(`(
              (${tableSql}.visibilidade IN ('publico', 'formadores') AND (
                ${tableSql}.area = 'Geral'
                OR ${tableSql}.area IN (
                  SELECT p.specialization FROM profiles p
                  INNER JOIN formando_formadores ff ON ff.formador_id = p.id
                  WHERE ff.formando_id = $${valueIndex} AND ff.status IN ('aceite')
                )
                OR ${tableSql}.area IN (
                  SELECT t.area FROM turmas t
                  INNER JOIN turma_membros tm ON tm.turma_id = t.id
                  WHERE tm.formando_id = $${valueIndex}
                )
              ))
              OR (${tableSql}.visibilidade = 'turma' AND ${tableSql}.turma_id IN (
                SELECT turma_id FROM turma_membros WHERE formando_id = $${valueIndex}
              ))
              OR (${tableSql}.visibilidade = 'formadores_turma' AND ${tableSql}.turma_id IN (
                SELECT turma_id FROM turma_membros WHERE formando_id = $${valueIndex}
              ))
            )`);
            values.push(sessionUser.id);
            valueIndex++;
          }
        }
        // admin/super-admin: sem filtro adicional, vêem tudo
      } else {
        filters.push(`${tableSql}.visibilidade = 'publico' AND ${tableSql}.area = 'Geral'`);
      }
    }

    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("eq.")) {
        const column = key.slice(3);
        filters.push(`${tableSql}.${assertIdentifier(column)} = $${valueIndex++}`);
        values.push(value);
      }
      if (key.startsWith("gte.")) {
        const column = key.slice(4);
        filters.push(`${tableSql}.${assertIdentifier(column)} >= $${valueIndex++}`);
        values.push(value);
      }
      if (key.startsWith("lte.")) {
        const column = key.slice(4);
        filters.push(`${tableSql}.${assertIdentifier(column)} <= $${valueIndex++}`);
        values.push(value);
      }
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    let fromSql = `FROM ${tableSql}`;
    let selectSql = `${tableSql}.*`;

    const selectRequested = url.searchParams.get("select") ?? "*";
    if (table === "tickets" && selectRequested.includes("profiles(")) {
      fromSql += ` LEFT JOIN profiles ON profiles.id = ${tableSql}.user_id`;
      selectSql += `, profiles.first_name AS profile_first_name, profiles.last_name AS profile_last_name, profiles.role AS profile_role`;
    }

    if (table === "comunidade_posts" && selectRequested.includes("profiles(")) {
      fromSql += ` LEFT JOIN profiles ON profiles.id = ${tableSql}.user_id`;
      selectSql += `, profiles.first_name AS profile_first_name, profiles.last_name AS profile_last_name, profiles.role AS profile_role, profiles.avatar_url AS profile_avatar_url`;
    }

    if (table === "arquivos" && selectRequested.includes("profiles(")) {
      fromSql += ` LEFT JOIN profiles ON profiles.id = ${tableSql}.uploader_id`;
      selectSql += `, profiles.first_name AS profile_first_name, profiles.last_name AS profile_last_name, profiles.role AS profile_role, profiles.avatar_url AS profile_avatar_url`;
    }

    let orderSql = "";
    const orderBy = url.searchParams.get("orderBy");
    if (orderBy) {
      const asc = url.searchParams.get("ascending") !== "false";
      orderSql = `ORDER BY ${tableSql}.${assertIdentifier(orderBy)} ${asc ? "ASC" : "DESC"}`;
    }

    let limitSql = "";
    const limit = Number(url.searchParams.get("limit") ?? "0");
    const single = url.searchParams.get("single") === "true";
    if (single) {
      limitSql = "LIMIT 1";
    } else if (Number.isFinite(limit) && limit > 0) {
      limitSql = `LIMIT ${Math.floor(limit)}`;
    }

    const result = await dbQuery(
      `SELECT ${selectSql} ${fromSql} ${whereSql} ${orderSql} ${limitSql}`,
      values
    );

    const rows = mapJoinedRows(table, result.rows);
    return NextResponse.json({ data: single ? (rows[0] ?? null) : rows, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message || "Erro na consulta." } }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ table: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ data: null, error: { message: "Sessao expirada." } }, { status: 401 });
  }

  try {
    const params = await context.params;
    const table = parseTable(params);
    const tableSql = assertIdentifier(table);
    const body = await request.json();

    const payload = Array.isArray(body.values) ? body.values : [body.values ?? body];
    if (!payload.length) {
      return NextResponse.json({ data: null, error: { message: "Payload vazio." } }, { status: 400 });
    }

    const insertedRows: any[] = [];

    for (const item of payload) {
      if (table === "arquivos") {
        item.uploader_id = sessionUser.id;
      }
      const entries = Object.entries(item ?? {});
      if (!entries.length) continue;

      const columns = entries.map(([key]) => assertIdentifier(key)).join(", ");
      const values = entries.map(([, value]) => value);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

      const result = await dbQuery(
        `INSERT INTO ${tableSql} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      insertedRows.push(result.rows[0]);
    }

    return NextResponse.json({ data: insertedRows, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message || "Erro ao inserir registo." } }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ table: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ data: null, error: { message: "Sessao expirada." } }, { status: 401 });
  }

  try {
    const params = await context.params;
    const table = parseTable(params);
    const tableSql = assertIdentifier(table);
    const body = await request.json();

    const updates = body.updates ?? {};
    const eq = body.eq ?? {};

    const updateEntries = Object.entries(updates);
    if (!updateEntries.length) {
      return NextResponse.json({ data: null, error: { message: "Sem campos para atualizar." } }, { status: 400 });
    }

    const values: unknown[] = [];
    let idx = 1;

    const setParts = updateEntries.map(([key, value]) => {
      values.push(value);
      return `${assertIdentifier(key)} = $${idx++}`;
    });

    const filterParts = Object.entries(eq).map(([key, value]) => {
      values.push(value);
      return `${assertIdentifier(key)} = $${idx++}`;
    });

    const whereSql = filterParts.length ? `WHERE ${filterParts.join(" AND ")}` : "";

    const result = await dbQuery(
      `UPDATE ${tableSql} SET ${setParts.join(", ")}, updated_at = NOW() ${whereSql} RETURNING *`,
      values
    );

    return NextResponse.json({ data: result.rows, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message || "Erro ao atualizar registo." } }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ table: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ data: null, error: { message: "Sessao expirada." } }, { status: 401 });
  }

  try {
    const params = await context.params;
    const table = parseTable(params);
    const tableSql = assertIdentifier(table);
    const body = await request.json();
    const eq = body.eq ?? {};

    const values: unknown[] = [];
    let idx = 1;
    const filterParts = Object.entries(eq).map(([key, value]) => {
      values.push(value);
      return `${assertIdentifier(key)} = $${idx++}`;
    });

    const whereSql = filterParts.length ? `WHERE ${filterParts.join(" AND ")}` : "";

    const result = await dbQuery(`DELETE FROM ${tableSql} ${whereSql} RETURNING *`, values);
    return NextResponse.json({ data: result.rows, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message || "Erro ao eliminar registo." } }, { status: 400 });
  }
}
