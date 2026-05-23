#!/bin/bash
# =============================================================
# Script de configuração inicial da VPS
# Corre UMA VEZ após entrar na VPS pela primeira vez
# Testado em Ubuntu 22.04 / Debian 12
# Uso: bash vps-setup.sh
# =============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Sabermais — Setup inicial da VPS       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# --- 1. Actualiza o sistema ---
echo "==> [1/7] A actualizar pacotes do sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# --- 2. Instala dependências essenciais ---
echo "==> [2/7] A instalar git, curl, ufw..."
apt-get install -y -qq git curl ufw

# --- 3. Instala Docker + Docker Compose ---
echo "==> [3/7] A instalar Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "     Docker já está instalado."
fi

# --- 4. Configura a firewall (apenas SSH, HTTP, HTTPS) ---
echo "==> [4/7] A configurar firewall (ufw)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (necessário para certbot)
ufw allow 443/tcp   # HTTPS
# NOTA: a porta 9002 (Next.js) e 5432 (Postgres) NÃO são abertas
# Apenas acessíveis internamente pelo Docker
ufw --force enable
echo "     Firewall activa. Regras:"
ufw status

# --- 5. Cria utilizador para a aplicação (sem root) ---
echo "==> [5/7] A criar utilizador 'sabermais'..."
if ! id "sabermais" &>/dev/null; then
    useradd -m -s /bin/bash sabermais
    usermod -aG docker sabermais
    echo "     Utilizador 'sabermais' criado e adicionado ao grupo docker."
else
    echo "     Utilizador 'sabermais' já existe."
fi

# --- 6. Clona o repositório ---
echo "==> [6/7] A preparar directório da aplicação..."
mkdir -p /opt/sabermais
cd /opt/sabermais

if [ ! -d ".git" ]; then
    echo ""
    echo "     Introduz o URL do repositório Git (ex: git@github.com:utilizador/sabermais.git):"
    read -r REPO_URL
    git clone "$REPO_URL" .
else
    echo "     Repositório já existe. A fazer pull..."
    git pull origin main
fi

# Garante permissões correctas
chown -R sabermais:sabermais /opt/sabermais
mkdir -p /opt/sabermais/storage
mkdir -p /opt/sabermais/nginx/ssl

# --- 7. Cria o ficheiro .env.production ---
echo "==> [7/7] A configurar variáveis de ambiente..."
if [ ! -f ".env.production" ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  PASSO IMPORTANTE: configura as credenciais de produção  ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""

    # Gera valores seguros automaticamente
    DB_PASS=$(openssl rand -hex 32)
    SESSION_KEY=$(openssl rand -hex 64)

    echo "     A gerar palavra-passe da base de dados e segredo de sessão..."
    echo "     (guarda estes valores num local seguro!)"
    echo ""

    cat > .env.production << EOF
# Gerado automaticamente em $(date)
POSTGRES_DB=sabermais
POSTGRES_USER=sabermais
POSTGRES_PASSWORD=${DB_PASS}
DATABASE_URL=postgres://sabermais:${DB_PASS}@db:5432/sabermais
NEXT_PUBLIC_APP_URL=https://sabermais.edu.ao
SESSION_SECRET=${SESSION_KEY}
NODE_ENV=production
EOF

    echo "     ✅ Ficheiro .env.production criado com credenciais seguras."
    echo ""
    echo "     ⚠️  GUARDA ESTES VALORES:"
    echo "     DB Password : ${DB_PASS}"
    echo "     Session Key : ${SESSION_KEY}"
    echo ""
    echo "     O ficheiro está em: /opt/sabermais/.env.production"
    echo "     Permissões restritivas aplicadas (apenas root pode ler)."
    chmod 600 .env.production
else
    echo "     .env.production já existe. A manter valores actuais."
fi

# --- Certbot (SSL) ---
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PRÓXIMO PASSO: SSL com Let's Encrypt                        ║"
echo "║                                                               ║"
echo "║  1. Garante que o DNS já aponta para este servidor:          ║"
echo "║     A record: sabermais.edu.ao → $(curl -s ifconfig.me)       ║"
echo "║                                                               ║"
echo "║  2. Inicia os containers primeiro:                           ║"
echo "║     docker compose -f docker-compose.prod.yml up -d          ║"
echo "║                                                               ║"
echo "║  3. Depois corre o certbot:                                  ║"
echo "║     bash scripts/get-ssl.sh                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Setup inicial concluído!"
