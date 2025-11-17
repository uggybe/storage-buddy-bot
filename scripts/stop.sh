#!/bin/bash

# Скрипт для остановки Storage Buddy Bot
# Использование: ./scripts/stop.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Storage Buddy Bot...${NC}"

# Остановка всех сервисов
docker-compose down

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"

# Опционально - удаление volumes
read -p "Remove volumes (all data will be lost)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}⚠️  Removing all volumes and data...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✅ Volumes removed${NC}"
fi
