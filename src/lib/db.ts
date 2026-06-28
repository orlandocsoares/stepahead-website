import { Pool, QueryResult, QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool };

async function initializeDatabase(pool: Pool) {
  try {
    // 1. Add uploader_id to arquivos
    await pool.query(`
      ALTER TABLE arquivos 
      ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES auth_users(id) ON DELETE SET NULL;
    `);
    
    // 2. Add status to arquivos
    await pool.query(`
      ALTER TABLE arquivos 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'publicado';
    `);
    
    // 3. Add visibilidade to arquivos
    await pool.query(`
      ALTER TABLE arquivos 
      ADD COLUMN IF NOT EXISTS visibilidade TEXT DEFAULT 'publico';
    `);
    
    // 4. Add destinatario_email to arquivos
    await pool.query(`
      ALTER TABLE arquivos 
      ADD COLUMN IF NOT EXISTS destinatario_email TEXT DEFAULT NULL;
    `);

    // 5. Add thumbnail_url to arquivos
    await pool.query(`
      ALTER TABLE arquivos
      ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;
    `);

    console.log("Database schema initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
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
