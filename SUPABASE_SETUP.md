# Настройка Supabase для Telegram авторизации

## ⚠️ ВАЖНО: Отключите подтверждение email

Telegram авторизация использует виртуальные email адреса, которые не могут получать письма. Поэтому нужно отключить подтверждение email в Supabase.

### Шаги:

1. **Откройте ваш проект в Supabase Dashboard**
   - Перейдите на https://supabase.com/dashboard

2. **Откройте настройки аутентификации**
   - В левом меню: `Authentication` → `Providers` → `Email`

3. **Отключите подтверждение email**
   - Найдите опцию: **"Confirm email"** или **"Enable email confirmations"**
   - **ОТКЛЮЧИТЕ** эту опцию (снимите галочку)
   - Нажмите `Save`

4. **Альтернативный способ (через настройки Auth)**
   - В левом меню: `Authentication` → `Settings`
   - Найдите: **"Enable email confirmations"**
   - **ОТКЛЮЧИТЕ** эту опцию
   - Нажмите `Save`

## SQL Миграции

После отключения email confirmation, выполните SQL миграции в следующем порядке:

### 1. Fix Realtime (20251109000003_fix_realtime.sql)
### 2. Add Model Field (20251109000004_add_model_field.sql)
### 3. Create Categories (20251109000005_create_categories_table.sql)
### 4. Create Whitelist (20251109000006_create_whitelist_table.sql)

## Добавление пользователей в Whitelist

После выполнения миграций, добавьте свой Telegram ID в whitelist:

```sql
-- Узнайте ваш Telegram ID с помощью @userinfobot в Telegram
-- Затем выполните:
INSERT INTO public.whitelist (telegram_id, name)
VALUES (ваш_telegram_id, 'Ваше имя');
```

Пример:
```sql
INSERT INTO public.whitelist (telegram_id, name)
VALUES (123456789, 'Иван Петров');
```

## Проверка настроек

После всех настроек:
1. Откройте приложение через Telegram Mini App
2. Откройте консоль браузера (F12)
3. Следите за логами в консоли
4. Если видите ошибки - скопируйте их и сообщите разработчику

## Возможные проблемы

### "Бесконечная инициализация"
- **Причина**: Email confirmation включено в Supabase
- **Решение**: Отключите "Confirm email" в настройках Auth

### "У вас нет доступа к этому приложению. Ваш Telegram ID: XXXXX"
- **Причина**: Ваш Telegram ID не в whitelist
- **Решение**: Добавьте свой ID в whitelist (SQL выше)

### "Timeout checking whitelist"
- **Причина**: Функция is_telegram_user_whitelisted не существует
- **Решение**: Выполните миграцию 20251109000006_create_whitelist_table.sql

### "Сессия не создана после авторизации"
- **Причина**: Проблема с Supabase auth
- **Решение**: Проверьте настройки Auth, убедитесь что email confirmation отключено
