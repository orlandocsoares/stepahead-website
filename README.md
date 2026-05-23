# Saber Mais - Next.js + PostgreSQL

Projeto migrado para stack local sem servicos externos de BaaS.

## Stack

- Next.js 15
- PostgreSQL 16
- API interna em route handlers (App Router)
- Storage local em disco servido pela propria app

## Requisitos

- Docker Desktop
- Node.js 20+ (apenas para correr fora do Docker)

## Como correr com Docker (recomendado)

1. Construir e subir os containers:

```bash
docker compose up --build
```

2. Abrir no browser:

```text
http://localhost:9002
```

Servicos iniciados:

- App web: porta `9002`
- PostgreSQL: porta `5432`

## Parar ambiente

```bash
docker compose down
```

## Desenvolvimento sem Docker

1. Criar `.env` com base em `.env.example`.
2. Garantir PostgreSQL local a correr.
3. Instalar dependencias:

```bash
npm install
```

4. Arrancar app:

```bash
npm run dev
```

## Base de dados

- O schema inicial e dados seed estao em `docker/postgres/init.sql`.
- Tabelas principais: `auth_users`, `user_sessions`, `profiles`, `agenda_atividades`, `inscricoes_agenda`, `comunidade_posts`, `tickets`, `arquivos`, `documents`.

## Storage local

- Uploads sao guardados em `storage/`.
- Ficheiros publicos sao servidos em `/storage/v1/object/public/<bucket>/<ficheiro>`.

## Scripts

- `npm run dev` - ambiente de desenvolvimento
- `npm run typecheck` - validacao TypeScript
- `npm run build` - build de producao
- `npm run docker:up` - sobe stack Docker
- `npm run docker:down` - para stack Docker
