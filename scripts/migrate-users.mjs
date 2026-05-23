/**
 * migrate-users.mjs
 *
 * Exporta utilizadores, perfis e dados das tabelas do Supabase
 * e importa-os na base de dados PostgreSQL local.
 *
 * Uso:
 *   node scripts/migrate-users.mjs
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL=https://qwaoeikvwwthlgcpagyz.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   DATABASE_URL=postgres://sabermais:sabermais@localhost:5432/sabermais
 *
 * Nota sobre passwords:
 *   O Supabase usa bcrypt internamente e NÃO expõe os hashes de password via API.
 *   Os utilizadores migrados terão uma password temporária definida abaixo.
 *   Na próxima sessão devem alterar a password em Definições → Segurança.
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// ─── Configuração ──────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://sabermais:sabermais@localhost:5432/sabermais';

// Password temporária para todos os utilizadores migrados
// Devem alterá-la no primeiro login
const TEMP_PASSWORD = process.env.MIGRATION_TEMP_PASSWORD || 'SaberMais2026!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`
Erro: variáveis de ambiente em falta.
Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de correr este script.

Exemplo (PowerShell):
  $env:SUPABASE_URL="https://qwaoeikvwwthlgcpagyz.supabase.co"
  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
  $env:DATABASE_URL="postgres://sabermais:sabermais@localhost:5432/sabermais"
  node scripts/migrate-users.mjs
`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Password hashing (igual a src/lib/password.ts) ───────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// ─── Tabelas a migrar (para além de auth_users + profiles) ────────────────────

const TABLES_TO_MIGRATE = [
  'agenda_atividades',
  'inscricoes_agenda',
  'comunidade_posts',
  'tickets',
  'arquivos',
  'documents',
  'hero_telemetria',
  'dashboard_stats',
];

// ─── Funções auxiliares ────────────────────────────────────────────────────────

async function fetchAllRows(table) {
  const rows = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE - 1);
    if (error) throw new Error(`Erro a ler '${table}': ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function fetchAllUsers() {
  // listUsers não é paginado acima de 50 sem cursor — usa a paginação
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Erro a listar utilizadores: ${error.message}`);
    if (!data.users || data.users.length === 0) break;
    users.push(...data.users);
    if (!data.nextPage) break;
    page++;
  }
  return users;
}

// ─── Migração de utilizadores ─────────────────────────────────────────────────

async function migrateUsers(client) {
  console.log('\n👤 Migrando utilizadores (auth_users + profiles)...');

  let authUsers;
  try {
    authUsers = await fetchAllUsers();
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    return { userIdMap: {} };
  }

  // Mapa supabase_id → local_id (podem ser iguais se UUID já coincidir)
  const userIdMap = {};
  let inserted = 0;
  let skipped = 0;

  const passwordHash = hashPassword(TEMP_PASSWORD);

  for (const user of authUsers) {
    const supabaseId = user.id;
    const email = user.email;
    if (!email) { skipped++; continue; }

    try {
      // Tenta inserir com o mesmo UUID para preservar FK integridade
      const result = await client.query(
        `INSERT INTO auth_users (id, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET updated_at = EXCLUDED.updated_at
         RETURNING id`,
        [supabaseId, email, passwordHash, user.created_at || new Date(), new Date()]
      );
      const localId = result.rows[0].id;
      userIdMap[supabaseId] = localId;
      inserted++;
    } catch (err) {
      console.error(`  ✗ auth_user ${email}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`  auth_users: ${inserted} inseridos, ${skipped} ignorados`);
  return { userIdMap };
}

async function migrateProfiles(client, userIdMap) {
  console.log('\n📋 Migrando perfis...');

  let profiles;
  try {
    profiles = await fetchAllRows('profiles');
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const localId = userIdMap[profile.id] || profile.id;
    try {
      await client.query(
        `INSERT INTO profiles (
           id, email, first_name, last_name, role, status,
           bi_number, school, province, cv_summary, especialidade,
           specialization, genero, biografia, avatar_url,
           temporary_power, power_expires_at, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [
          localId,
          profile.email,
          profile.first_name,
          profile.last_name,
          profile.role || 'formando',
          profile.status || 'pendente',
          profile.bi_number,
          profile.school,
          profile.province,
          profile.cv_summary,
          profile.especialidade,
          profile.specialization,
          profile.genero,
          profile.biografia,
          profile.avatar_url,
          profile.temporary_power,
          profile.power_expires_at,
          profile.created_at || new Date(),
          profile.updated_at || new Date(),
        ]
      );
      inserted++;
    } catch (err) {
      console.error(`  ✗ profile ${profile.email}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`  profiles: ${inserted} inseridos/atualizados, ${skipped} erros`);
}

// ─── Migração de tabelas genéricas ────────────────────────────────────────────

async function migrateTable(client, table) {
  console.log(`\n📄 Migrando '${table}'...`);

  let rows;
  try {
    rows = await fetchAllRows(table);
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    return;
  }

  if (rows.length === 0) {
    console.log('  sem dados.');
    return;
  }

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const colNames = columns.map(c => `"${c}"`).join(', ');
  const sql = `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const values = columns.map(c => row[c]);
    try {
      await client.query(sql, values);
      inserted++;
    } catch (err) {
      console.error(`  ✗ row ${row.id}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`  ${table}: ${inserted} inseridos, ${skipped} ignorados/erros`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { userIdMap } = await migrateUsers(client);
    await migrateProfiles(client, userIdMap);

    for (const table of TABLES_TO_MIGRATE) {
      await migrateTable(client, table);
    }

    await client.query('COMMIT');
    console.log(`
✅ Migração de dados concluída.

⚠️  IMPORTANTE — Passwords:
   Os utilizadores migrados têm a password temporária: "${TEMP_PASSWORD}"
   Notifique os utilizadores para alterar a password no próximo login.
   (Dashboard → Definições → Segurança → Alterar password)

   Para definir uma password diferente, defina a variável MIGRATION_TEMP_PASSWORD
   antes de correr o script.
`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n✗ Migração falhou (rollback efectuado):', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
