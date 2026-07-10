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
      name: "add_ficha_inscricao_fields_to_profiles",
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nome_pai TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nome_mae TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telemovel TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS naturalidade_provincia TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS naturalidade_municipio TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS municipio_residencia TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS habilitacoes_academicas TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS curso_concluido TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agregacao_pedagogica BOOLEAN;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS municipio_escola TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ciclo_ensino TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anos_servico_docente INTEGER;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disciplinas_lecciona TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classes_lecciona TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cargos_pedagogicos TEXT`,
    },
    {
      name: "add_must_change_password_to_profiles",
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false`,
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
      name: "add_provincia_to_acoes_formacao",
      sql: `ALTER TABLE acoes_formacao ADD COLUMN IF NOT EXISTS provincia TEXT`,
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
    {
      name: "create_provincias_municipios",
      sql: `CREATE TABLE IF NOT EXISTS provincias (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        nome       TEXT        NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS municipios (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        nome          TEXT        NOT NULL,
        provincia_id  UUID        NOT NULL REFERENCES provincias(id) ON DELETE CASCADE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(nome, provincia_id)
      );
      CREATE INDEX IF NOT EXISTS idx_municipios_provincia ON municipios(provincia_id)`,
    },
    {
      name: "seed_provincias",
      sql: `INSERT INTO provincias (nome) VALUES
        ('Cabinda'),
        ('Zaire'),
        ('Uíge'),
        ('Bengo'),
        ('Luanda'),
        ('Icolo e Bengo'),
        ('Cuanza Norte'),
        ('Cuanza Sul'),
        ('Malanje'),
        ('Lunda Norte'),
        ('Lunda Sul'),
        ('Moxico'),
        ('Moxico Leste'),
        ('Bié'),
        ('Huambo'),
        ('Benguela'),
        ('Namibe'),
        ('Huíla'),
        ('Cunene'),
        ('Cubango'),
        ('Cuando')
      ON CONFLICT (nome) DO NOTHING`,
    },
    {
      name: "seed_municipios",
      sql: `INSERT INTO municipios (nome, provincia_id) SELECT 'Cabinda', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cacongo', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Buco Zau', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Belize', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Miconje', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Massabi', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Necuto', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Tando Zinze', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Liambo', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ngoio', id FROM provincias WHERE nome = 'Cabinda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Soyo', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mbanza Kongo', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nzeto', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Tomboco', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuimba', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nóqui', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luvo', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lufico', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quêlo', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Serra de Canda', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quindeje', id FROM provincias WHERE nome = 'Zaire' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dange Quitexe', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bungo', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ambuíla', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Negage', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Puri', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Maquela do Zombo', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Damba', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sanza Pombo', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bembe', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Milunga', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Songo', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quimbele', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cangola', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Uíge', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mucaba', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nova Esperança', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sacandica', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nsosso', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lucunga', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quipedro', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Massau', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Vista Alegre', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Alto Zaza', id FROM provincias WHERE nome = 'Uíge' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dande', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quibaxe', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Muxaluando', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bula Atumba', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ambriz', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Pango Aluquém', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Barra do Dande', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Piri', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quicunzo', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nambuangongo', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Úcua', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Panguíla', id FROM provincias WHERE nome = 'Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ingombota', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cacuaco', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cazenga', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Viana', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Belas', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Kilamba Kiaxi', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Talatona', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mussulo', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sambizanga', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Rangel', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Maianga', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Samba', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Camama', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mulenvos', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Kilamba', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Hoji ya Henda', id FROM provincias WHERE nome = 'Luanda' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Catete', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quiçama', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Calumbo', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cabiri', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cabo Ledo', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bom Jesus', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sequele', id FROM provincias WHERE nome = 'Icolo e Bengo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cazengo', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Golungo Alto', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cambambe', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Samba Caju', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ambaca', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lucala', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Banga', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bolongongo', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quiculungo', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ngonguembo', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Massangano', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cêrca', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Tango', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Terreiro', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Aldeia Nova', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caculo Cabaça', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luinga', id FROM provincias WHERE nome = 'Cuanza Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sumbe', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Calulo', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Gabela', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cassongue', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Porto Amboím', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quibala', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Seles', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Waku Kungo', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mussende', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quilenda', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ebo', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Conda', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quirimbo', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Munenga', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quissongo', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Gungo', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sanga', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Gangula', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Pambangala', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Condé', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Amboiva', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lonhe', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quenha', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Boa Entrada', id FROM provincias WHERE nome = 'Cuanza Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Calandula', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Malanje', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cacuso', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Massango', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Marimba', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quela', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quirima', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cangandala', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cahombo', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Kunda dya Baze', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cambundi Catembo', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caculama', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Kiwaba Nzoji', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luquembo', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cateco Cangola', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mbanji ya Ngola', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuale', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Pungu a Ndongo', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ngola Luiji', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quihuhu', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Xandel', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cambo Suinginge', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Milando', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quitapa', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Capunda', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Muquixe', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quêssua', id FROM provincias WHERE nome = 'Malanje' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuilo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dundo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lubalo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Capenda Camulemba', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuango', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lucapa', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cambulo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Xá Muteba', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caungula', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lóvua', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chitato', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Xá Cassau', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Camaxilo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luangue', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luremo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Canzar', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cassanje Calucala', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mussungue', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cafunfo', id FROM provincias WHERE nome = 'Lunda Norte' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Saurimo', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Muconda', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cacolo', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dala', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chiluage', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cassai-Sul', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Xassengue', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Alto Chicapa', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sombo', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Muriege', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luma Cassai', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cazage', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Muangueji', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cassengo', id FROM provincias WHERE nome = 'Lunda Sul' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luena', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cangamba', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lumbala Nguimbo', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Camanongue', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Léua', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lutembo', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lucusse', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cangumbe', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chiúme', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Alto Cuito', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ninda', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lutuai', id FROM provincias WHERE nome = 'Moxico' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cazombo', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luacano', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cameia', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luau', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nana Candundo', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Macondo', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caianda', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lóvua do Zambeze', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lago Dilolo', id FROM provincias WHERE nome = 'Moxico Leste' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Andulo', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chitembo', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuito', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Camacupa', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chinguar', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Catabola', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cunhinga', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuemba', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nharêa', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luando', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ringoma', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mumbué', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Calucinga', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chicala', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chipeta', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Umpulo', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lúbia', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cambândua', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Belo Horizonte', id FROM provincias WHERE nome = 'Bié' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bailundo', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Huambo', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Londuimbali', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caála', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chicala Choloanga', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cachiungo', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mungo', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Longonjo', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ucuma', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ecunha', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chinjenje', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bimbe', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sambo', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Galanga', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Alto Hama', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chilata', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuima', id FROM provincias WHERE nome = 'Huambo' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Benguela', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ganda', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lobito', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Catumbela', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bocoio', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Balombo', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cubal', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Baía Farta', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caimbambo', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chongorói', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Egito Praia', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chindumbo', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dombe Grande', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Capupa', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Biópio', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chila', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chicuma', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Babaera', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Iambala', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Catengue', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bolonguera', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Canhamela', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Navegantes', id FROM provincias WHERE nome = 'Benguela' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Moçâmedes', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Tômbwa', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Bibala', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Virei', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Camucuio', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lucira', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Iona', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Sacomar', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cacimbas', id FROM provincias WHERE nome = 'Namibe' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caconda', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Gambos', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Humpata', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Lubango', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuvango', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quipungo', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chibia', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Quilengues', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caluquembe', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Matala', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Jamba Mineira', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chipindo', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chicomba', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cacula', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dongo', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Hoque', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Capelongo', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chituto', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Capunda Cavilongo', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Viti Vivali', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Galangue', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Palanca', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chicungo', id FROM provincias WHERE nome = 'Huíla' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Ombadja', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuanhama', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Curoca', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cahama', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuvelai', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Namacunde', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chiéde', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nehone', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Humbe', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mupa', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Naulila', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chitado', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cafima', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chissuata', id FROM provincias WHERE nome = 'Cunene' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Menongue', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuchi', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Calai', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Nancova', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuangar', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Savate', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Caiundo', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Longa', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cutato', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Chinguanja', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mavengue', id FROM provincias WHERE nome = 'Cubango' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Cuito Cuanavale', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dirico', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mavinga', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Rivungo', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Xipundo', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Dima', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luiana', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Mucusso', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;
            INSERT INTO municipios (nome, provincia_id) SELECT 'Luengue', id FROM provincias WHERE nome = 'Cuando' ON CONFLICT DO NOTHING;`,
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
