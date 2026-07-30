import { Pool, QueryResult, QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool };

async function initializeDatabase(pool: Pool) {
  try {
    // --- arquivos: colunas adicionais ---
    await pool.query(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES auth_users(id) ON DELETE SET NULL`);
    await pool.query(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'publicado'`);
    await pool.query(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS visibilidade TEXT DEFAULT 'publico'`);
    await pool.query(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS destinatario_email TEXT DEFAULT NULL`);
    await pool.query(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL`);

    // --- pastas: organização de documentos do Repositório ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pastas (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        nome              TEXT        NOT NULL,
        area              TEXT        NOT NULL,
        acao_formacao_id  UUID        REFERENCES acoes_formacao(id) ON DELETE SET NULL,
        criado_por        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS pasta_id UUID REFERENCES pastas(id) ON DELETE SET NULL`);

    // --- tarefas: disciplina (mesma taxonomia de "área" usada no Repositório) ---
    await pool.query(`ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS area TEXT`);

    // --- audit_logs: registo de acções críticas ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        action     TEXT        NOT NULL,
        actor_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
        target_id  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
        ip         TEXT,
        details    JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_logs(actor_id, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC)`);

    // --- limpeza de sessões expiradas (corre uma vez ao arrancar) ---
    await pool.query(`DELETE FROM user_sessions WHERE expires_at < NOW()`);

    // --- heartbeat: última actividade real da sessão, para saber quem está online agora ---
    await pool.query(`ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);

    console.log("[db] schema initialised");
  } catch (error) {
    console.error("[db] schema init error:", error);
  }
}

function getPool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const pool = new Pool({ connectionString, max: 5 });
  globalForDb.pool = pool; // sempre reutilizar — evita "too many clients"

  initializeDatabase(pool);

  return pool;
}

export const db = { query: (...args: any[]) => (getPool().query as any)(...args) } as unknown as Pool;

export function assertIdentifier(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return db.query<T>(text, values);
}
