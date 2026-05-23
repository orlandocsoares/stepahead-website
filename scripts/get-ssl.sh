#!/bin/bash
# =============================================================
# Obtém certificado SSL gratuito com Let's Encrypt (Certbot)
# Corre DEPOIS de vps-setup.sh e de o DNS já estar configurado
# Uso: bash scripts/get-ssl.sh
# =============================================================

set -e

DOMAIN="sabermais.edu.ao"
EMAIL="admin@sabermais.edu.ao"   # ← muda para o teu email real

cd /opt/sabermais

echo "==> A verificar se o Certbot está instalado..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot
fi

echo "==> A pedir certificado para ${DOMAIN}..."
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}"

echo "==> A copiar certificados para o directório do NGINX..."
mkdir -p ./nginx/ssl/live/${DOMAIN}
cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ./nginx/ssl/live/${DOMAIN}/
cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem   ./nginx/ssl/live/${DOMAIN}/

echo "==> A activar configuração NGINX com SSL..."
cp ./nginx/nginx.ssl.conf ./nginx/nginx.conf

echo "==> A reiniciar NGINX..."
docker compose -f docker-compose.prod.yml restart nginx

# Renova automaticamente (cron job)
echo "==> A configurar renovação automática..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /opt/sabermais/nginx/ssl/live/${DOMAIN}/fullchain.pem && cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /opt/sabermais/nginx/ssl/live/${DOMAIN}/privkey.pem && docker compose -f /opt/sabermais/docker-compose.prod.yml restart nginx") | crontab -

echo ""
echo "✅ SSL configurado com sucesso!"
echo "   Acede em: https://${DOMAIN}"
echo "   Renovação automática: todos os dias às 3h00"
