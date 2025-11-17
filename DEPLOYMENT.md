# 🚀 Self-Hosted развёртывание на Windows 10

## Предварительные требования

✅ Docker Desktop установлен и запущен
✅ Node.js установлен (проверьте: `node -v`)
✅ Git установлен

---

## 📦 Шаг 1: Развёртывание локального Supabase

### 1.1 Установка Supabase CLI

Откройте PowerShell/CMD и выполните:

```bash
npm install -g supabase
```

### 1.2 Инициализация Supabase в проекте

```bash
cd storage-buddy-bot
supabase init
```

Это создаст папку `supabase/` с конфигурацией.

### 1.3 Запуск локального Supabase

```bash
supabase start
```

**Важно!** Команда выведет credentials. Сохраните их:

```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4 Применение миграций

Ваши миграции уже в `supabase/migrations/`. Примените их:

```bash
supabase db reset
```

Это создаст все таблицы, функции и правила доступа.

---

## 🌐 Шаг 2: Настройка Frontend

### 2.1 Обновить .env файл

Создайте файл `.env.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key из вывода supabase start>
```

### 2.2 Установить зависимости

```bash
npm install
```

### 2.3 Запуск в режиме разработки

```bash
npm run dev
```

Откроется на `http://localhost:8080`

### 2.4 Production сборка (опционально)

```bash
npm run build
```

Статические файлы будут в папке `dist/`

---

## 📱 Шаг 3: Настройка доступа из Telegram

Telegram Mini App требует **HTTPS** и **публичный URL**.

### 3.1 Установка ngrok (бесплатный туннель)

1. Скачайте ngrok: https://ngrok.com/download
2. Распакуйте в любую папку
3. Зарегистрируйтесь на ngrok.com (бесплатно)
4. Получите authtoken в личном кабинете

### 3.2 Запуск ngrok

```bash
ngrok http 8080
```

Вывод будет примерно таким:

```
Forwarding   https://abc123.ngrok.io -> http://localhost:8080
```

**Важно!** Скопируйте HTTPS URL (например `https://abc123.ngrok.io`)

### 3.3 Настройка Telegram Bot

1. Откройте @BotFather в Telegram
2. Найдите вашего бота
3. Установите Web App URL:

```
/setmenubutton
# Выберите вашего бота
# Выберите "Edit Menu Button URL"
# Вставьте: https://abc123.ngrok.io
```

---

## 🔐 Шаг 4: Настройка whitelist (доступ пользователей)

### 4.1 Откройте Supabase Studio

Откройте в браузере: `http://localhost:54323`

### 4.2 Добавьте себя в whitelist

SQL Editor → выполните:

```sql
INSERT INTO telegram_whitelist (telegram_id, first_name, last_name)
VALUES (123456789, 'Ваше Имя', 'Ваша Фамилия');
```

Замените `123456789` на ваш реальный Telegram ID.

**Как узнать свой Telegram ID?**
- Напишите боту @userinfobot в Telegram
- Или откройте консоль браузера при входе в приложение

---

## 🎯 Шаг 5: Запуск всей системы

### Терминал 1 - Supabase
```bash
supabase start
# Должен быть постоянно запущен
```

### Терминал 2 - Frontend
```bash
npm run dev
```

### Терминал 3 - ngrok
```bash
ngrok http 8080
```

---

## ✅ Проверка работоспособности

1. ✅ Supabase Studio: http://localhost:54323
2. ✅ Frontend локально: http://localhost:8080
3. ✅ Frontend публично: https://ваш-ngrok-url.ngrok.io
4. ✅ Telegram Mini App через вашего бота

---

## 📊 Мониторинг и отладка

### Логи Supabase
```bash
supabase status
docker ps  # Проверить запущенные контейнеры
docker logs supabase-db  # Логи PostgreSQL
```

### Логи Frontend
В браузере: F12 → Console

### База данных
Studio: http://localhost:54323
Или через psql:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 🔄 Резервное копирование

### Бэкап базы данных
```bash
supabase db dump -f backup.sql
```

### Восстановление
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres < backup.sql
```

---

## 🛑 Остановка сервисов

```bash
# Остановить Supabase
supabase stop

# Остановить Frontend
Ctrl+C в терминале

# Остановить ngrok
Ctrl+C в терминале
```

---

## 💡 Альтернатива ngrok (платная версия)

Если хотите постоянный URL без ngrok:

1. **Cloudflare Tunnel** (бесплатно, но сложнее)
2. **Купить домен + VPS** (~$5/месяц)
3. **DuckDNS + Port Forwarding** (бесплатно, если роутер поддерживает)

---

## 🐛 Частые проблемы

### Проблема: Docker не запускается
**Решение:**
- Откройте Docker Desktop
- Проверьте, что WSL2 включён (Settings → General → Use WSL2)

### Проблема: Порты заняты
**Решение:**
```bash
# Проверить занятые порты
netstat -ano | findstr :54321
# Убить процесс
taskkill /PID <номер> /F
```

### Проблема: Миграции не применяются
**Решение:**
```bash
supabase db reset --debug
```

### Проблема: Telegram не подключается
**Решение:**
- Проверьте ngrok URL (должен быть HTTPS)
- Обновите URL в @BotFather
- Очистите кэш Telegram

---

## 📞 Поддержка

- Supabase: https://supabase.com/docs
- ngrok: https://ngrok.com/docs
- Telegram Bot API: https://core.telegram.org/bots/webapps
