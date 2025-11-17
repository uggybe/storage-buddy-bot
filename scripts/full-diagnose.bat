@echo off
echo ========================================
echo ПОЛНАЯ ДИАГНОСТИКА Storage Buddy Bot
echo ========================================
echo.

echo [1/6] Проверка файлов миграций...
echo Старые миграции (НЕ должны существовать):
dir supabase\migrations\20250111*.sql 2>nul
if errorlevel 1 (
    echo OK: Старые миграции 20250111 не найдены
) else (
    echo ОШИБКА: Найдены старые файлы миграций! Нужен git pull
)

dir supabase\migrations\20250113*.sql 2>nul
if errorlevel 1 (
    echo OK: Старые миграции 20250113 не найдены
) else (
    echo ОШИБКА: Найдены старые файлы миграций! Нужен git pull
)

echo.
echo Новые миграции (ДОЛЖНЫ существовать):
dir supabase\migrations\20251117*.sql
echo.

echo [2/6] Проверка git статуса...
git status --short
echo.

echo [3/6] Проверка последних коммитов...
git log --oneline -5
echo.

echo [4/6] Статус Docker сервисов...
docker compose ps
echo.

echo [5/6] Логи PostgreSQL (последние 40 строк)...
docker compose logs postgres --tail 40
echo.

echo [6/6] Проверка Docker volumes...
docker volume ls | findstr storage-buddy
echo.

echo ========================================
echo РЕКОМЕНДАЦИИ:
echo ========================================
echo.
echo Если видите старые файлы 20250111 или 20250113:
echo   1. Выполните: git pull
echo   2. Затем: docker compose down -v
echo   3. Затем: docker compose up -d
echo.
echo Если НЕТ старых файлов, но ошибка осталась:
echo   1. docker compose down
echo   2. docker volume rm storage-buddy-bot_postgres-data
echo   3. docker compose up -d
echo.
pause
