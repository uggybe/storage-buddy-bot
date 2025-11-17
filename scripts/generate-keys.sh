#!/bin/bash

# Скрипт для генерации JWT ключей и секретов
# Использование: ./generate-keys.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Generating JWT keys and secrets for Supabase self-hosted${NC}"
echo ""

# Генерация JWT_SECRET
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo -e "${YELLOW}JWT_SECRET:${NC}"
echo "$JWT_SECRET"
echo ""

# Генерация SECRET_KEY_BASE
SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')
echo -e "${YELLOW}SECRET_KEY_BASE:${NC}"
echo "$SECRET_KEY_BASE"
echo ""

# Генерация POSTGRES_PASSWORD
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
echo -e "${YELLOW}POSTGRES_PASSWORD:${NC}"
echo "$POSTGRES_PASSWORD"
echo ""

# Функция для генерации JWT токена
generate_jwt() {
    local role=$1
    local secret=$2

    # Header
    header='{"alg":"HS256","typ":"JWT"}'
    header_b64=$(echo -n "$header" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

    # Payload
    # iat = issued at (текущее время)
    # exp = expiration (10 лет в будущем)
    iat=$(date +%s)
    exp=$((iat + 315360000)) # 10 лет

    payload="{\"iss\":\"supabase\",\"role\":\"$role\",\"iat\":$iat,\"exp\":$exp}"
    payload_b64=$(echo -n "$payload" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

    # Signature
    signature=$(echo -n "${header_b64}.${payload_b64}" | openssl dgst -sha256 -hmac "$secret" -binary | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

    # JWT token
    echo "${header_b64}.${payload_b64}.${signature}"
}

# Генерация ANON KEY
echo -e "${YELLOW}Generating SUPABASE_ANON_KEY...${NC}"
ANON_KEY=$(generate_jwt "anon" "$JWT_SECRET")
echo -e "${YELLOW}SUPABASE_ANON_KEY:${NC}"
echo "$ANON_KEY"
echo ""

# Генерация SERVICE_ROLE KEY
echo -e "${YELLOW}Generating SUPABASE_SERVICE_KEY...${NC}"
SERVICE_KEY=$(generate_jwt "service_role" "$JWT_SECRET")
echo -e "${YELLOW}SUPABASE_SERVICE_KEY:${NC}"
echo "$SERVICE_KEY"
echo ""

# Создаем .env.local файл если его нет
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 Creating .env.local file...${NC}"

    # Получаем локальный IP адрес
    LOCAL_IP=$(hostname -I | awk '{print $1}')

    cat > .env.local << EOF
############################################
# Storage Buddy Bot - Self-Hosted Configuration
# Auto-generated on $(date)
############################################

# PostgreSQL Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=3600
SECRET_KEY_BASE=$SECRET_KEY_BASE

# Supabase API Keys
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY

# Supabase URLs (замените на ваш IP или домен)
SUPABASE_PUBLIC_URL=http://$LOCAL_IP:8000
SITE_URL=http://$LOCAL_IP
ADDITIONAL_REDIRECT_URLS=http://localhost:5173,http://localhost:3000

# Authentication
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_ANONYMOUS_USERS=false
ENABLE_EMAIL_AUTOCONFIRM=true

# SMTP (настройте если нужны email уведомления)
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=Storage Buddy Bot

# Telegram Bot
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

# Organization
DEFAULT_ORGANIZATION_NAME=Storage Buddy
DEFAULT_PROJECT_NAME=Storage Buddy Bot

# Image Processing
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Frontend Environment Variables
VITE_SUPABASE_URL=http://$LOCAL_IP:8000
VITE_SUPABASE_ANON_KEY=$ANON_KEY
VITE_TELEGRAM_API_URL=http://$LOCAL_IP/telegram

# Environment
NODE_ENV=production
EOF

    echo -e "${GREEN}✅ .env.local file created${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please update the following in .env.local:${NC}"
    echo "  - TELEGRAM_BOT_TOKEN"
    echo "  - SMTP settings (if you want email notifications)"
    echo "  - SUPABASE_PUBLIC_URL and SITE_URL (if using domain name)"
else
    echo -e "${YELLOW}⚠️  .env.local already exists. Here are the generated values:${NC}"
    echo ""
    echo -e "${BLUE}Add these to your .env.local file:${NC}"
    echo ""
    echo "JWT_SECRET=$JWT_SECRET"
    echo "SECRET_KEY_BASE=$SECRET_KEY_BASE"
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
    echo "SUPABASE_ANON_KEY=$ANON_KEY"
    echo "SUPABASE_SERVICE_KEY=$SERVICE_KEY"
fi

echo ""
echo -e "${GREEN}🎉 Keys generated successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Save these keys securely!${NC}"
echo -e "${YELLOW}⚠️  Never commit .env.local to git!${NC}"
