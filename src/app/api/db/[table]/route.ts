import { NextResponse } from "next/server";
import { assertIdentifier, dbQuery } from "@/lib/db";
import { getSessionUser } from "@/lib/server-auth";
import { auditLog, type AuditAction } from "@/lib/audit";

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

/**
 * Colunas permitidas por tabela no GET genérico.
 * Protege contra leitura de campos internos (password_hash, tokens, etc.).
 * `null` = sem restrição (tabelas sem dados sensíveis).
 */
const ALLOWED_COLUMNS: Record<string, Set<string> | null> = {
  profiles: new Set([
    "id", "email", "first_name", "last_name", "role", "status",
    "avatar_url", "provincia", "escola", "especialidade", "biografia",
    "specialization", "genero", "bi_number", "cv_summary", "created_at", "updated_at",
  ]),
  // Tabelas sem dados sensíveis — sem restrição de colunas
  hero_telemetria:      null,
  dashboard_stats:      null,
  agenda_atividades:    null,
  inscricoes_agenda:    null,
  comunidade_posts:     null,
  tickets:              null,
  arquivos:             null,
  documents:            null,
  turmas:               null,
  turma_membros:        null,
  comunidade_comentarios: null,
  comunidade_gostos:    null,
  ticket_mensagens:     null,
};

// Tabelas fora destes mapas (ticket_mensagens, hero_telemetria, dashboard_stats)
// ficam de fora do audit log: mensagens por privacidade, telemetria por ser ruído de sistema.
const CREATE_AUDIT_MAP: Partial<Record<string, AuditAction>> = {
  arquivos: "ficheiro_upload",
  agenda_atividades: "evento_create",
  comunidade_posts: "post_create",
  comunidade_comentarios: "comentario_create",
  comunidade_gostos: "gosto_create",
  tickets: "ticket_create",
  inscricoes_agenda: "inscricao_create",
  documents: "document_create",
};

const UPDATE_AUDIT_MAP: Partial<Record<string, AuditAction>> = {
  profiles: "profile_update",
  tickets: "ticket_update",
  arquivos: "ficheiro_edit",
  comunidade_posts: "post_update",
  agenda_atividades: "evento_update",
  documents: "document_update",
};

const DELETE_AUDIT_MAP: Partial<Record<string, AuditAction>> = {
  arquivos: "ficheiro_delete",
  agenda_atividades: "evento_delete",
  comunidade_posts: "post_delete",
  comunidade_comentarios: "comentario_delete",
  comunidade_gostos: "gosto_delete",
  tickets: "ticket_delete",
  inscricoes_agenda: "inscricao_delete",
  documents: "document_delete",
};

/** Regex de UUID v4 para validar parâmetros de ID nas queries */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        // Validar UUID quando a coluna termina em '_id' ou se chama 'id'
        if ((column === "id" || column.endsWith("_id")) && !UUID_RE.test(value)) {
          return NextResponse.json({ data: null, error: { message: "ID inválido." } }, { status: 400 });
        }
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

    // Para tabelas com whitelist, expandir explicitamente as colunas permitidas
    // em vez de usar `*` — evita expor campos adicionados à BD no futuro.
    const allowedCols = ALLOWED_COLUMNS[table];
    let selectSql = allowedCols
      ? [...allowedCols].map(c => `${tableSql}.${assertIdentifier(c)}`).join(", ")
      : `${tableSql}.*`;

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
    console.error("[db-route GET]", error.message);
    return NextResponse.json({ data: null, error: { message: "Erro ao processar consulta." } }, { status: 400 });
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

    // Audit log — regista tudo o que o utilizador faz, exceto mensagens/telemetria.
    if (CREATE_AUDIT_MAP[table]) {
      const first = insertedRows[0];
      await auditLog(CREATE_AUDIT_MAP[table]!, {
        actorId: sessionUser.id,
        targetId: first?.id,
        details: table === "arquivos" ? { label: first?.label, area: first?.area } :
                 table === "agenda_atividades" ? { titulo: first?.titulo } :
                 table === "comunidade_posts" ? { content: String(first?.content ?? "").slice(0, 100) } :
                 table === "tickets" ? { subject: first?.subject, category: first?.category } :
                 table === "inscricoes_agenda" ? { evento_id: first?.evento_id } :
                 table === "comunidade_gostos" ? { post_id: first?.post_id } :
                 table === "documents" ? { title: first?.title } : undefined,
      });
    }

    return NextResponse.json({ data: insertedRows, error: null });
  } catch (error: any) {
    console.error("[db-route POST]", error.message);
    return NextResponse.json({ data: null, error: { message: "Erro ao inserir registo." } }, { status: 400 });
  }
}

// Campos que nunca podem ser alterados por utilizadores não-admin
const PROTECTED_FIELDS = new Set(["role", "status", "id", "email"]);

// Tabelas onde o utilizador só pode editar os seus próprios registos
const OWNED_TABLES: Record<string, string> = {
  profiles: "id",
  tickets: "user_id",
  comunidade_posts: "user_id",
  ticket_mensagens: "user_id",
};

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

    // Verificar role do utilizador
    const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
    const userRole = profileRes.rows[0]?.role ?? "formando";
    const isAdminUser = userRole === "admin" || userRole === "super-admin";

    // Bloquear edição de campos protegidos para não-admins
    if (!isAdminUser) {
      for (const field of Object.keys(updates)) {
        if (PROTECTED_FIELDS.has(field)) {
          return NextResponse.json({ data: null, error: { message: `Campo '${field}' não pode ser alterado.` } }, { status: 403 });
        }
      }
    }

    // Validar ownership para tabelas próprias
    const ownerField = OWNED_TABLES[table];
    if (ownerField && !isAdminUser) {
      // Verificar que o eq aponta para um registo do próprio utilizador
      const ownerValue = table === "profiles" ? eq.id : eq[ownerField];
      if (!ownerValue || ownerValue !== sessionUser.id) {
        return NextResponse.json({ data: null, error: { message: "Sem permissão para editar este registo." } }, { status: 403 });
      }
    }

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

    if (UPDATE_AUDIT_MAP[table] && result.rows.length > 0) {
      const first = result.rows[0];
      await auditLog(UPDATE_AUDIT_MAP[table]!, {
        actorId: sessionUser.id,
        targetId: first?.id,
        details: table === "tickets" ? { status: first?.status } : { fields: Object.keys(updates) },
      });
    }

    return NextResponse.json({ data: result.rows, error: null });
  } catch (error: any) {
    console.error("[db-route PATCH]", error.message);
    return NextResponse.json({ data: null, error: { message: "Erro ao atualizar registo." } }, { status: 400 });
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

    // Verificar role do utilizador
    const profileRes = await dbQuery(`SELECT role FROM profiles WHERE id = $1 LIMIT 1`, [sessionUser.id]);
    const userRole = profileRes.rows[0]?.role ?? "formando";
    const isAdminUser = userRole === "admin" || userRole === "super-admin";

    // Validar ownership para tabelas próprias
    const ownerField = OWNED_TABLES[table];
    if (ownerField && !isAdminUser) {
      const ownerValue = table === "profiles" ? eq.id : eq[ownerField];
      if (!ownerValue || ownerValue !== sessionUser.id) {
        return NextResponse.json({ data: null, error: { message: "Sem permissão para eliminar este registo." } }, { status: 403 });
      }
    }

    const values: unknown[] = [];
    let idx = 1;
    const filterParts = Object.entries(eq).map(([key, value]) => {
      values.push(value);
      return `${assertIdentifier(key)} = $${idx++}`;
    });

    const whereSql = filterParts.length ? `WHERE ${filterParts.join(" AND ")}` : "";

    const result = await dbQuery(`DELETE FROM ${tableSql} ${whereSql} RETURNING *`, values);

    if (DELETE_AUDIT_MAP[table] && result.rows.length > 0) {
      const first = result.rows[0];
      await auditLog(DELETE_AUDIT_MAP[table]!, {
        actorId: sessionUser.id,
        targetId: first?.id,
        details: table === "arquivos" ? { label: first?.label, area: first?.area } :
                 table === "tickets" ? { subject: first?.subject } : undefined,
      });
    }

    return NextResponse.json({ data: result.rows, error: null });
  } catch (error: any) {
    console.error("[db-route DELETE]", error.message);
    return NextResponse.json({ data: null, error: { message: "Erro ao eliminar registo." } }, { status: 400 });
  }
}
