# Como executar os scripts de migração

## Pré-requisitos

1. Ter o servidor local a correr:
   ```
   docker compose up -d
   ```
2. Ter acesso ao dashboard do Supabase para obter a **Service Role Key**:
   - Supabase Dashboard → Project Settings → API → `service_role` (secret key)

---

## 1 — Instalar dependências dos scripts

```powershell
cd scripts
npm install
cd ..
```

---

## 2 — Migrar assets (imagens, animações, logos)

Define as variáveis de ambiente e corre:

```powershell
$env:SUPABASE_URL="https://qwaoeikvwwthlgcpagyz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # Service Role Key do Supabase
node scripts/migrate-assets.mjs
```

Os ficheiros serão descarregados para:
```
storage/
  Nuvem LooP/          ← frames de animação WebP
  Logo Sabermais/      ← logótipo principal
  Logo Institutos/     ← logos dos institutos parceiros
```

---

## 3 — Migrar utilizadores e dados

```powershell
$env:SUPABASE_URL="https://qwaoeikvwwthlgcpagyz.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
$env:DATABASE_URL="postgres://sabermais:sabermais@localhost:5432/sabermais"
$env:MIGRATION_TEMP_PASSWORD="SaberMais2026!"   # password temporária opcional
node scripts/migrate-users.mjs
```

**O que é migrado:**
- `auth_users` — contas de utilizador (email + password temporária)
- `profiles` — perfis completos (nome, BI, escola, etc.)
- `agenda_atividades` — atividades agendadas
- `inscricoes_agenda` — inscrições
- `comunidade_posts` — posts da comunidade
- `tickets` — tickets de suporte
- `arquivos` — ficheiros do repositório
- `documents` — documentos
- `hero_telemetria` — estatísticas do hero
- `dashboard_stats` — stats do dashboard

**Nota sobre passwords:**
O Supabase não expõe hashes de password via API (por segurança). Todos os utilizadores migrados recebem a password temporária definida em `MIGRATION_TEMP_PASSWORD`. Devem alterá-la no primeiro login em **Definições → Segurança**.

---

## 4 — Verificar

```powershell
# Ver containers
docker compose ps

# Ver utilizadores migrados
docker exec -it sabermais-postgres psql -U sabermais -c "SELECT email, role FROM profiles ORDER BY created_at;"
```
