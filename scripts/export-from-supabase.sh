#!/bin/bash

# Скрипт для экспорта данных из Supabase Cloud
# Использование: ./export-from-supabase.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Supabase database export...${NC}"

# Проверка наличия supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Проверка .env файла
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Создаем директорию для бэкапов
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📁 Backup directory: $BACKUP_DIR${NC}"

# Получаем project ID из .env
PROJECT_ID="${VITE_SUPABASE_PROJECT_ID}"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_PROJECT_ID not found in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Exporting database schema...${NC}"

# Экспортируем схему базы данных
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.${PROJECT_ID}.supabase.co:5432/postgres" \
  --schema public > "$BACKUP_DIR/schema.sql"

echo -e "${GREEN}✅ Schema exported to $BACKUP_DIR/schema.sql${NC}"

echo -e "${YELLOW}📊 Exporting database data...${NC}"

# Экспортируем данные
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.${PROJECT_ID}.supabase.co:5432/postgres" \
  --data-only --schema public > "$BACKUP_DIR/data.sql"

echo -e "${GREEN}✅ Data exported to $BACKUP_DIR/data.sql${NC}"

echo -e "${YELLOW}📊 Exporting storage files...${NC}"

# Создаем список файлов в Storage (требует дополнительной настройки)
echo "-- Storage files export requires manual configuration" > "$BACKUP_DIR/storage-info.txt"
echo "-- Use Supabase Dashboard to download storage files" >> "$BACKUP_DIR/storage-info.txt"

echo -e "${GREEN}✅ Storage info saved to $BACKUP_DIR/storage-info.txt${NC}"

# Создаем README с инструкциями
cat > "$BACKUP_DIR/README.md" << EOF
# Supabase Backup - $(date +%Y-%m-%d\ %H:%M:%S)

## Содержимое бэкапа

- \`schema.sql\` - Схема базы данных (таблицы, индексы, функции)
- \`data.sql\` - Данные всех таблиц
- \`storage-info.txt\` - Информация о файлах в Storage

## Восстановление

### 1. Восстановление схемы:
\`\`\`bash
psql -U postgres -d postgres -f schema.sql
\`\`\`

### 2. Восстановление данных:
\`\`\`bash
psql -U postgres -d postgres -f data.sql
\`\`\`

### 3. Восстановление storage файлов:
Скопируйте файлы из Supabase Storage в директорию \`./volumes/storage\`

## Примечания

- Убедитесь, что локальная PostgreSQL база данных запущена
- Проверьте версию PostgreSQL (должна быть >= 15)
- Storage файлы нужно скачать вручную из Supabase Dashboard
EOF

echo -e "${GREEN}✅ README created${NC}"
echo -e "${GREEN}🎉 Export completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Update database password in schema.sql if needed"
echo "2. Download Storage files from Supabase Dashboard"
echo "3. Run import script to restore data to local database"
