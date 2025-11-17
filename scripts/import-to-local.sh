#!/bin/bash

# Скрипт для импорта данных в локальную PostgreSQL базу
# Использование: ./import-to-local.sh [путь-к-бэкапу]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting database import to local PostgreSQL...${NC}"

# Проверка аргументов
if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: $0 <backup-directory>${NC}"
    echo "Example: $0 ./backups/20240115_120000"
    exit 1
fi

BACKUP_DIR="$1"

# Проверка существования директории с бэкапом
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Проверка наличия необходимых файлов
if [ ! -f "$BACKUP_DIR/schema.sql" ]; then
    echo -e "${RED}❌ schema.sql not found in $BACKUP_DIR${NC}"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/data.sql" ]; then
    echo -e "${RED}❌ data.sql not found in $BACKUP_DIR${NC}"
    exit 1
fi

# Загружаем переменные окружения
if [ -f .env.local ]; then
    source .env.local
else
    echo -e "${YELLOW}⚠️  .env.local not found, using default values${NC}"
fi

# Параметры подключения к локальной БД
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Проверка доступности PostgreSQL
echo -e "${YELLOW}🔍 Checking PostgreSQL connection...${NC}"

if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
    echo "Please ensure PostgreSQL is running:"
    echo "  docker-compose up -d postgres"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"

# Предупреждение о перезаписи данных
echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE existing data in the database!${NC}"
read -p "Do you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Import cancelled."
    exit 0
fi

echo -e "${YELLOW}📊 Importing schema...${NC}"

# Импортируем схему
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  -f "$BACKUP_DIR/schema.sql" 2>&1 | grep -v "already exists" || true

echo -e "${GREEN}✅ Schema imported${NC}"

echo -e "${YELLOW}📊 Importing data...${NC}"

# Импортируем данные
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  -f "$BACKUP_DIR/data.sql"

echo -e "${GREEN}✅ Data imported${NC}"

# Применяем все миграции из директории supabase/migrations
if [ -d "supabase/migrations" ]; then
    echo -e "${YELLOW}📊 Applying migrations...${NC}"

    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo -e "${YELLOW}  Applying $(basename $migration)...${NC}"
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
              -f "$migration" 2>&1 | grep -v "already exists" || true
        fi
    done

    echo -e "${GREEN}✅ Migrations applied${NC}"
fi

# Проверяем количество записей в основных таблицах
echo -e "${YELLOW}📊 Verifying data...${NC}"

echo -e "${YELLOW}Tables and row counts:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
    schemaname,
    tablename,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
    SELECT
        schemaname,
        tablename,
        query_to_xml(format('select count(*) as cnt from %I.%I', schemaname, tablename), false, true, '') as xml_count
    FROM pg_tables
    WHERE schemaname = 'public'
) t
ORDER BY row_count DESC;
"

echo -e "${GREEN}🎉 Import completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Copy storage files to ./volumes/storage/"
echo "2. Update .env.local with correct URLs and keys"
echo "3. Start all services: docker-compose up -d"
echo "4. Test the application at http://localhost"
