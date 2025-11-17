#!/bin/bash

# Скрипт для запуска Storage Buddy Bot
# Использование: ./scripts/start.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Storage Buddy Bot...${NC}"
echo ""

# Проверка .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo -e "${YELLOW}Please run: ./scripts/generate-keys.sh${NC}"
    exit 1
fi

# Проверка dist директории
if [ ! -d dist ]; then
    echo -e "${YELLOW}⚠️  Frontend not built yet.${NC}"
    echo -e "${YELLOW}Building frontend...${NC}"
    npm install
    npm run build
    echo -e "${GREEN}✅ Frontend built${NC}"
fi

# Запуск Docker Compose
echo -e "${BLUE}📦 Starting Docker containers...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""

# Ждем пока сервисы запустятся
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Проверка статуса
echo ""
echo -e "${BLUE}📊 Services status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}🎉 Storage Buddy Bot is running!${NC}"
echo ""
echo -e "${YELLOW}📝 Access points:${NC}"
echo -e "  ${BLUE}•${NC} Application:    http://localhost"
echo -e "  ${BLUE}•${NC} Supabase Studio: http://localhost:3000"
echo -e "  ${BLUE}•${NC} API Gateway:     http://localhost:8000"
echo -e "  ${BLUE}•${NC} Telegram API:    http://localhost:3001/health"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo -e "  ${BLUE}•${NC} View logs:       docker-compose logs -f"
echo -e "  ${BLUE}•${NC} Stop services:   ./scripts/stop.sh"
echo -e "  ${BLUE}•${NC} Restart:         ./scripts/restart.sh"
echo -e "  ${BLUE}•${NC} Create backup:   ./scripts/backup-local.sh"
echo ""

# Открываем логи в следящем режиме (можно прервать Ctrl+C)
read -p "Show logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi
