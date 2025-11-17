#!/bin/bash

# Скрипт для просмотра логов Storage Buddy Bot
# Использование: ./scripts/logs.sh [service-name]

set -e

# Цвета для вывода
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    # Показываем логи всех сервисов
    echo -e "${BLUE}📋 Showing logs for all services...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    echo ""
    docker-compose logs -f
else
    # Показываем логи конкретного сервиса
    SERVICE=$1
    echo -e "${BLUE}📋 Showing logs for $SERVICE...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    echo ""
    docker-compose logs -f "$SERVICE"
fi
