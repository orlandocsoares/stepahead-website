import { Pool, QueryResult, QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool };

function getPool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const pool = new Pool({ connectionString, max: 10 });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
  }
  return pool;
}

export const db = { query: (...args: Parameters<Pool["query"]>) => getPool().query(...args as any) } as Pool;

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
