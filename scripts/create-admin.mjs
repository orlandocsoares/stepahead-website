/**
 * create-admin.mjs
 *
 * Cria um utilizador admin na base de dados local.
 *
 * Uso:
 *   node scripts/create-admin.mjs
 *
 * Variáveis de ambiente opcionais:
 *   ADMIN_EMAIL=admin@sabermais.ao
 *   ADMIN_PASSWORD=Admin2026!
 *   DATABASE_URL=postgres://sabermais:sabermais@localhost:5432/sabermais
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const EMAIL    = process.env.ADMIN_EMAIL    || 'admin@sabermais.ao';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2026!';
const DB_URL   = process.env.DATABASE_URL   || 'postgres://sabermais:sabermais@localhost:5432/sabermais';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 64, 'sha512').toString('hex');
  return `120000:${salt}:${hash}`;
}

const pool = new Pool({ connectionString: DB_URL });

async function run() {
  const client = await pool.connect();
  try {
    // Verificar se já existe
    const existing = await client.query(
      'SELECT id FROM auth_users WHERE email = $1',
      [EMAIL]
    );

    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      // Atualizar password
      await client.query(
        'UPDATE auth_users SET password_hash = $1 WHERE id = $2',
        [hashPassword(PASSWORD), userId]
      );
      console.log(`✓ Utilizador existente atualizado: ${EMAIL}`);
    } else {
      const result = await client.query(
        'INSERT INTO auth_users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [EMAIL, hashPassword(PASSWORD)]
      );
      userId = result.rows[0].id;
      console.log(`✓ Utilizador criado: ${EMAIL}`);
    }

    // Upsert perfil como super-admin aprovado
    await client.query(
      `INSERT INTO profiles (id, email, first_name, last_name, role, status)
       VALUES ($1, $2, 'Admin', 'SaberMais', 'super-admin', 'aprovado')
       ON CONFLICT (id) DO UPDATE SET
         role   = 'super-admin',
         status = 'aprovado',
         first_name = COALESCE(profiles.first_name, 'Admin'),
         last_name  = COALESCE(profiles.last_name, 'SaberMais')`,
      [userId, EMAIL]
    );

    console.log(`
✅ Admin criado com sucesso!

   Email:    ${EMAIL}
   Password: ${PASSWORD}
   Role:     super-admin
   Status:   aprovado

Aceda em: http://localhost:9002/login
`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
