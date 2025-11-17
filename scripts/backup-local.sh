#!/bin/bash

# Скрипт для создания бэкапов локальной базы данных
# Использование: ./backup-local.sh
# Можно добавить в cron для автоматических бэкапов

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting local database backup...${NC}"

# Загружаем переменные окружения
if [ -f .env.local ]; then
    source .env.local
else
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

# Параметры подключения
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Директория для бэкапов
BACKUP_BASE_DIR="./backups/local"
BACKUP_DIR="$BACKUP_BASE_DIR/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📁 Backup directory: $BACKUP_DIR${NC}"

# Проверка подключения к БД
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Creating database dump...${NC}"

# Создаем полный дамп базы данных
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_DIR/database.dump"

echo -e "${GREEN}✅ Database dump created${NC}"

# Также создаем SQL версию для читаемости
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --schema=public \
  --file="$BACKUP_DIR/database.sql"

echo -e "${GREEN}✅ SQL dump created${NC}"

# Копируем storage файлы
if [ -d "./volumes/storage" ]; then
    echo -e "${YELLOW}📦 Backing up storage files...${NC}"
    tar -czf "$BACKUP_DIR/storage.tar.gz" -C ./volumes storage
    echo -e "${GREEN}✅ Storage files backed up${NC}"
else
    echo -e "${YELLOW}⚠️  Storage directory not found, skipping...${NC}"
fi

# Получаем статистику базы данных
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
    SELECT
        schemaname,
        tablename,
        query_to_xml(format('select count(*) as cnt from %I.%I', schemaname, tablename), false, true, '') as xml_count
    FROM pg_tables
    WHERE schemaname = 'public'
) t
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
" > "$BACKUP_DIR/stats.txt"

echo -e "${GREEN}✅ Database stats saved${NC}"

# Создаем информационный файл
cat > "$BACKUP_DIR/backup-info.txt" << EOF
Backup Created: $(date +"%Y-%m-%d %H:%M:%S")
Database Host: $DB_HOST
Database Port: $DB_PORT
Database Name: $DB_NAME
Database User: $DB_USER

Files:
- database.dump (pg_dump custom format, compressed)
- database.sql (plain SQL format)
- storage.tar.gz (storage files)
- stats.txt (database statistics)

Restore commands:
1. Restore database:
   pg_restore -h localhost -p 5432 -U postgres -d postgres --clean database.dump

2. Or restore from SQL:
   psql -h localhost -p 5432 -U postgres -d postgres -f database.sql

3. Restore storage:
   tar -xzf storage.tar.gz -C ./volumes/
EOF

# Вычисляем размер бэкапа
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "${GREEN}✅ Backup info created${NC}"
echo -e "${GREEN}📦 Backup size: $BACKUP_SIZE${NC}"

# Удаляем старые бэкапы (оставляем последние 7)
echo -e "${YELLOW}🧹 Cleaning old backups...${NC}"
cd "$BACKUP_BASE_DIR"
ls -t | tail -n +8 | xargs -r rm -rf
BACKUPS_COUNT=$(ls -1 | wc -l)
echo -e "${GREEN}✅ Kept last $BACKUPS_COUNT backups${NC}"
cd - > /dev/null

echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}📦 Backup size: $BACKUP_SIZE${NC}"

# Опционально: копируем на внешнее хранилище (раскомментируйте если нужно)
# echo -e "${YELLOW}📤 Copying to external storage...${NC}"
# rsync -avz "$BACKUP_DIR" /path/to/external/storage/
# echo -e "${GREEN}✅ Copied to external storage${NC}"
