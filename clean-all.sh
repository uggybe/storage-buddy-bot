#!/bin/bash
# =========================================
# Полная очистка проекта для чистого старта
# Для Linux/macOS
# =========================================

echo "========================================"
echo "ВНИМАНИЕ! Это удалит:"
echo "========================================"
echo "- Все Docker контейнеры Supabase"
echo "- Все данные локальной БД"
echo "- node_modules (зависимости)"
echo "- .env.local (если есть)"
echo "========================================"
echo ""
read -p "Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Отменено."
    exit 0
fi

echo ""
echo "[1/5] Остановка и удаление Supabase..."
supabase stop --no-backup 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Supabase остановлен"
else
    echo "Supabase не был запущен или не установлен"
fi

echo ""
echo "[2/5] Удаление Docker контейнеров Supabase..."
docker ps -a --filter "name=supabase" -q | xargs -r docker rm -f
echo "✓ Контейнеры удалены"

echo ""
echo "[3/5] Удаление Docker volumes..."
docker volume ls --filter "name=supabase" -q | xargs -r docker volume rm
echo "✓ Volumes удалены"

echo ""
echo "[4/5] Удаление node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "✓ node_modules удалены"
else
    echo "node_modules не найдены"
fi

echo ""
echo "[5/5] Удаление .env.local..."
if [ -f ".env.local" ]; then
    rm .env.local
    echo "✓ .env.local удалён"
else
    echo ".env.local не найден"
fi

echo ""
echo "========================================"
echo "✓ Очистка завершена!"
echo "========================================"
echo ""
echo "Теперь можно начать с нуля:"
echo "1. Откройте QUICK_START.md"
echo "2. Следуйте инструкциям из раздела 'Первый запуск'"
echo ""
