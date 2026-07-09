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
    {
      name: "create_anos_letivos",
      sql: `CREATE TABLE IF NOT EXISTS anos_letivos (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        ano_letivo TEXT        NOT NULL UNIQUE,
        activo     BOOLEAN     NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    },
    {
      name: "seed_ano_letivo_2025_2026",
      sql: `INSERT INTO anos_letivos (ano_letivo, activo) VALUES ('2025/2026', true) ON CONFLICT (ano_letivo) DO NOTHING`,
    },
    {
      name: "create_formacoes",
      sql: `CREATE TABLE IF NOT EXISTS formacoes (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        nome        TEXT        NOT NULL,
        area        TEXT,
        descricao   TEXT,
        activo      BOOLEAN     NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    },
    {
      name: "create_acoes_formacao",
      sql: `CREATE TABLE IF NOT EXISTS acoes_formacao (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        formacao_id   UUID        REFERENCES formacoes(id) ON DELETE SET NULL,
        designacao    TEXT        NOT NULL,
        data_inicio   DATE,
        data_fim      DATE,
        horario       TEXT,
        local         TEXT,
        modalidade    TEXT        NOT NULL DEFAULT 'presencial',
        vagas_max     INTEGER,
        estado        TEXT        NOT NULL DEFAULT 'agendada',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    },
    {
      name: "create_acoes_formacao_indexes",
      sql: `CREATE INDEX IF NOT EXISTS idx_acoes_formacao_formacao ON acoes_formacao(formacao_id);
            CREATE INDEX IF NOT EXISTS idx_acoes_formacao_estado   ON acoes_formacao(estado)`,
    },
    {
      name: "create_acao_formadores",
      sql: `CREATE TABLE IF NOT EXISTS acao_formadores (
        acao_formacao_id UUID        NOT NULL REFERENCES acoes_formacao(id) ON DELETE CASCADE,
        formador_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (acao_formacao_id, formador_id)
      )`,
    },
    {
      name: "create_acao_formadores_index",
      sql: `CREATE INDEX IF NOT EXISTS idx_acao_formadores_formador ON acao_formadores(formador_id)`,
    },
    {
      name: "create_inscricoes_acao",
      sql: `CREATE TABLE IF NOT EXISTS inscricoes_acao (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        formando_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        acao_formacao_id  UUID        NOT NULL REFERENCES acoes_formacao(id) ON DELETE CASCADE,
        status            TEXT        NOT NULL DEFAULT 'inscrito',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(formando_id, acao_formacao_id)
      )`,
    },
    {
      name: "create_inscricoes_acao_indexes",
      sql: `CREATE INDEX IF NOT EXISTS idx_inscricoes_acao_formando ON inscricoes_acao(formando_id, status);
            CREATE INDEX IF NOT EXISTS idx_inscricoes_acao_acao     ON inscricoes_acao(acao_formacao_id, status)`,
    },
    {
      name: "add_acao_formacao_id_to_agenda_atividades",
      sql: `ALTER TABLE agenda_atividades ADD COLUMN IF NOT EXISTS acao_formacao_id UUID REFERENCES acoes_formacao(id) ON DELETE SET NULL`,
    },
    {
      name: "add_acao_formacao_id_to_arquivos",
      sql: `ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS acao_formacao_id UUID REFERENCES acoes_formacao(id) ON DELETE SET NULL`,
    },
    {
      name: "create_arquivos_acao_formacao_index",
      sql: `CREATE INDEX IF NOT EXISTS idx_arquivos_acao_formacao ON arquivos(acao_formacao_id)`,
    },
    {
      name: "add_imagem_url_to_acoes_formacao",
      sql: `ALTER TABLE acoes_formacao ADD COLUMN IF NOT EXISTS imagem_url TEXT`,
    },
    {
      name: "add_anexo_to_mensagens",
      sql: `ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS anexo_url TEXT;
            ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS anexo_nome TEXT;
            ALTER TABLE mensagens ALTER COLUMN content DROP NOT NULL`,
    },
    {
      name: "add_area_to_acoes_formacao",
      sql: `ALTER TABLE acoes_formacao ADD COLUMN IF NOT EXISTS area TEXT`,
    },
    {
      name: "create_arquivo_acoes_formacao",
      sql: `CREATE TABLE IF NOT EXISTS arquivo_acoes_formacao (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        arquivo_id        UUID        NOT NULL REFERENCES arquivos(id) ON DELETE CASCADE,
        acao_formacao_id  UUID        NOT NULL REFERENCES acoes_formacao(id) ON DELETE CASCADE,
        disponivel_de     TIMESTAMPTZ,
        disponivel_ate    TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(arquivo_id, acao_formacao_id)
      )`,
    },
    {
      name: "create_arquivo_acoes_formacao_indexes",
      sql: `CREATE INDEX IF NOT EXISTS idx_arq_acoes_arquivo ON arquivo_acoes_formacao(arquivo_id);
            CREATE INDEX IF NOT EXISTS idx_arq_acoes_acao     ON arquivo_acoes_formacao(acao_formacao_id)`,
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
