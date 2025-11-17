@echo off
REM =========================================
REM Полная очистка проекта для чистого старта
REM =========================================

echo ========================================
echo ВНИМАНИЕ! Это удалит:
echo ========================================
echo - Все Docker контейнеры Supabase
echo - Все данные локальной БД
echo - node_modules (зависимости)
echo - .env.local (если есть)
echo ========================================
echo.
set /p confirm="Продолжить? (yes/no): "

if not "%confirm%"=="yes" (
    echo Отменено.
    pause
    exit /b 0
)

echo.
echo [1/5] Остановка и удаление Supabase...
supabase stop --no-backup 2>nul
if errorlevel 1 (
    echo Supabase не был запущен или не установлен
) else (
    echo ✓ Supabase остановлен
)

echo.
echo [2/5] Удаление Docker контейнеров Supabase...
docker ps -a --filter "name=supabase" -q > temp_containers.txt
for /f %%i in (temp_containers.txt) do (
    docker rm -f %%i
)
del temp_containers.txt
echo ✓ Контейнеры удалены

echo.
echo [3/5] Удаление Docker volumes...
docker volume ls --filter "name=supabase" -q > temp_volumes.txt
for /f %%i in (temp_volumes.txt) do (
    docker volume rm %%i
)
del temp_volumes.txt
echo ✓ Volumes удалены

echo.
echo [4/5] Удаление node_modules...
if exist "node_modules\" (
    rmdir /s /q node_modules
    echo ✓ node_modules удалены
) else (
    echo node_modules не найдены
)

echo.
echo [5/5] Удаление .env.local...
if exist ".env.local" (
    del .env.local
    echo ✓ .env.local удалён
) else (
    echo .env.local не найден
)

echo.
echo ========================================
echo ✓ Очистка завершена!
echo ========================================
echo.
echo Теперь можно начать с нуля:
echo 1. Откройте QUICK_START.md
echo 2. Следуйте инструкциям из раздела "Первый запуск"
echo.

pause
