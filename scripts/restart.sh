#!/bin/bash

# Скрипт для перезапуска Storage Buddy Bot
# Использование: ./scripts/restart.sh [service-name]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    # Перезапуск всех сервисов
    echo -e "${YELLOW}🔄 Restarting all services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ All services restarted${NC}"
else
    # Перезапуск конкретного сервиса
    SERVICE=$1
    echo -e "${YELLOW}🔄 Restarting $SERVICE...${NC}"
    docker-compose restart "$SERVICE"
    echo -e "${GREEN}✅ $SERVICE restarted${NC}"
fi

echo ""
echo -e "${BLUE}📊 Services status:${NC}"
docker-compose ps

# Показываем логи перезапущенного сервиса
if [ ! -z "$1" ]; then
    echo ""
    read -p "Show logs for $SERVICE? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose logs -f "$SERVICE"
    fi
fi
