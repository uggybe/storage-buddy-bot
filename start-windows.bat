@echo off
REM =========================================
REM Скрипт запуска для Windows 10
REM =========================================

echo ========================================
echo Storage Buddy - Self-Hosted Startup
echo ========================================
echo.

REM Проверка Docker Desktop
echo [1/4] Проверка Docker Desktop...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Docker не найден!
    echo Пожалуйста, запустите Docker Desktop
    pause
    exit /b 1
)
echo ✓ Docker работает

REM Проверка Node.js
echo.
echo [2/4] Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не найден!
    echo Установите Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js установлен

REM Проверка зависимостей
echo.
echo [3/4] Проверка зависимостей...
if not exist "node_modules\" (
    echo Установка зависимостей...
    call npm install
    if errorlevel 1 (
        echo ОШИБКА: Не удалось установить зависимости
        pause
        exit /b 1
    )
)
echo ✓ Зависимости установлены

REM Проверка Supabase CLI
echo.
echo [4/4] Проверка Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo Supabase CLI не найден. Устанавливаем...
    call npm install -g supabase
    if errorlevel 1 (
        echo ОШИБКА: Не удалось установить Supabase CLI
        pause
        exit /b 1
    )
)
echo ✓ Supabase CLI готов

echo.
echo ========================================
echo Выберите режим запуска:
echo ========================================
echo 1. Запустить ВСЁ (Supabase + Frontend)
echo 2. Только Supabase
echo 3. Только Frontend
echo 4. Применить миграции БД
echo 5. Открыть Supabase Studio
echo 6. Выход
echo.

set /p choice="Ваш выбор (1-6): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_supabase
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto apply_migrations
if "%choice%"=="5" goto open_studio
if "%choice%"=="6" goto end

echo Неверный выбор!
pause
exit /b 1

:start_all
echo.
echo Запуск Supabase...
start "Supabase" cmd /k "supabase start && echo Supabase запущен! && echo Studio: http://localhost:54323 && pause"
timeout /t 10 /nobreak >nul
echo.
echo Запуск Frontend...
start "Frontend" cmd /k "npm run dev"
echo.
echo ========================================
echo ✓ Все сервисы запущены!
echo ========================================
echo.
echo Frontend:        http://localhost:8080
echo Supabase Studio: http://localhost:54323
echo.
echo Для публичного доступа запустите ngrok:
echo   ngrok http 8080
echo.
pause
goto end

:start_supabase
echo.
echo Запуск Supabase...
supabase start
pause
goto end

:start_frontend
echo.
echo Запуск Frontend...
npm run dev
pause
goto end

:apply_migrations
echo.
echo Применение миграций...
supabase db reset
echo.
echo ✓ Миграции применены!
pause
goto end

:open_studio
echo.
echo Открытие Supabase Studio...
start http://localhost:54323
pause
goto end

:end
echo.
echo Готово!
