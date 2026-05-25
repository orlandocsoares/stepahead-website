#!/bin/bash
echo "--- Verificando Variáveis de Ambiente ---"
# Variáveis definidas na sua infraestrutura
REQUIRED_VARS=("DATABASE_URL" "POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "NEXT_PUBLIC_APP_URL" "SESSION_SECRET")

# Verifica se o ficheiro existe no servidor
if [ -f .env.production ]; then
    echo "Ficheiro .env.production encontrado."
    # Carrega variáveis para teste
    source .env.production
else
    echo "ERRO: Ficheiro .env.production em falta no servidor!"
    exit 1
fi

# Valida se cada uma tem valor
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "AVISO: A variável $var não está definida."
    else
        echo "OK: $var configurada."
    fi
done