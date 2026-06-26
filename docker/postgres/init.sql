CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'formando',
  status TEXT NOT NULL DEFAULT 'pendente',
  bi_number TEXT,
  school TEXT,
  province TEXT,
  cv_summary TEXT,
  especialidade TEXT,
  specialization TEXT,
  genero TEXT,
  biografia TEXT,
  avatar_url TEXT,
  temporary_power TEXT,
  power_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_telemetria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_alunos INT NOT NULL DEFAULT 0,
  total_formadores INT NOT NULL DEFAULT 0,
  taxa_conclusao NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provincia TEXT NOT NULL,
  valor INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agenda_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  local TEXT NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Global',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inscricoes_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  evento_id UUID NOT NULL REFERENCES agenda_atividades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, evento_id)
);

CREATE TABLE IF NOT EXISTS comunidade_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Metodologia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Geral',
  tamanho TEXT,
  tipo TEXT,
  uploader_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'publicado',
  visibilidade TEXT NOT NULL DEFAULT 'publico',
  destinatario_email TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Manuais',
  file_url TEXT NOT NULL,
  size TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_agenda_data_evento ON agenda_atividades(data_evento);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON comunidade_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arquivos_created_at ON arquivos(created_at DESC);

INSERT INTO hero_telemetria (total_alunos, total_formadores, taxa_conclusao)
SELECT 2000, 120, 87.5
WHERE NOT EXISTS (SELECT 1 FROM hero_telemetria);

INSERT INTO dashboard_stats (provincia, valor)
SELECT * FROM (VALUES
  ('Luanda', 92),
  ('Bie', 74)
) AS v(provincia, valor)
WHERE NOT EXISTS (SELECT 1 FROM dashboard_stats);

INSERT INTO agenda_atividades (titulo, local, data_evento, tipo)
SELECT * FROM (VALUES
  ('Sessao de Metodologia Ativa', 'Luanda', NOW() + INTERVAL '7 days', 'Global'),
  ('Laboratorio Pedagogico', 'Online', NOW() + INTERVAL '14 days', 'Global')
) AS v(titulo, local, data_evento, tipo)
WHERE NOT EXISTS (SELECT 1 FROM agenda_atividades);
