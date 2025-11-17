# Как обновить репозиторий (для пользователя)

## Проблема

При выполнении `git pull` вы получили ошибку:
```
error: Your local changes to the following files would be overwritten by merge:
        .env
Please commit your changes or stash them before you merge.
```

## Решение

### Шаг 1: Сохраните ваш Telegram Bot Token (если есть)

Откройте ваш текущий файл `.env` и **скопируйте** значение `TELEGRAM_BOT_TOKEN`, если оно там есть.

### Шаг 2: Сохраните текущие изменения

В Command Prompt выполните:

```cmd
git stash
```

Это временно сохранит ваши локальные изменения.

### Шаг 3: Подтяните новые изменения

```cmd
git pull
```

Теперь pull должен пройти успешно!

### Шаг 4: Обновите .env файл

1. Откройте файл `.env` в текстовом редакторе
2. Найдите строку:
   ```
   TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
   ```
3. Замените `YOUR_TELEGRAM_BOT_TOKEN_HERE` на ваш реальный токен (который вы скопировали в Шаге 1)
4. Сохраните файл

### Шаг 5: Готово!

Теперь можете запускать Docker:

```cmd
docker compose down -v
docker compose up -d
```

---

## Альтернативный способ (если не нужен старый .env)

Если в вашем старом `.env` не было ничего важного:

```cmd
git checkout -- .env
git pull
```

Затем просто добавьте ваш Telegram Bot Token в новый `.env` файл.

---

## Что изменилось в .env

**Старый .env** (облачная конфигурация):
- VITE_SUPABASE_URL=https://hoqyxyggjkidwmmsanec.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY=ey...
- Только 3 переменные

**Новый .env** (self-hosted конфигурация):
- POSTGRES_PASSWORD=postgres
- JWT_SECRET=...
- SUPABASE_ANON_KEY=...
- VITE_SUPABASE_URL=http://localhost:8000
- И еще ~20 переменных для self-hosted инфраструктуры

Новый `.env` файл **необходим** для работы self-hosted версии!

---

## Если что-то пошло не так

Если запутались, можете полностью сбросить репозиторий:

```cmd
git reset --hard origin/claude/migrate-codebase-0162MzHjCXqtHHawhnmpUkWb
```

**ВНИМАНИЕ**: Это удалит все ваши локальные изменения!

После этого добавьте ваш Telegram Bot Token в `.env` и запускайте Docker.
