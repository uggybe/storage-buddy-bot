# Инструкции по деплою Edge Functions

## Вариант 1: Через Supabase Dashboard (рекомендуется)

### Шаг 1: Откройте проект
Перейдите: https://supabase.com/dashboard/project/hoqyxyggjkidwmmsanec

### Шаг 2: Создайте Edge Function
1. В левом меню выберите **Edge Functions**
2. Нажмите **Create a new function** или **Deploy existing function**
3. Введите имя функции: `send-telegram-file`

### Шаг 3: Скопируйте код
Откройте файл `supabase/functions/send-telegram-file/index.ts` и скопируйте весь код в редактор Dashboard

### Шаг 4: Deploy
Нажмите кнопку **Deploy**

### Шаг 5: Настройте переменные окружения (опционально)
1. Перейдите в **Settings** → **Edge Functions** → **Environment Variables**
2. Добавьте переменную:
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: `8139201002:AAGbwoT9GVX5eMQMkxfd4Uu_ZW4mRCOhmTI`
3. Если не добавите, будет работать fallback из кода

### Шаг 6: Проверьте URL функции
После деплоя URL будет:
```
https://hoqyxyggjkidwmmsanec.supabase.co/functions/v1/send-telegram-file
```

---

## Вариант 2: Через Supabase CLI

### Установка CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**npm:**
```bash
npm install -g supabase
```

### Деплой функции

1. **Залогиньтесь:**
   ```bash
   supabase login
   ```

2. **Свяжите проект:**
   ```bash
   cd /home/user/storage-buddy-bot
   supabase link --project-ref hoqyxyggjkidwmmsanec
   ```

3. **Задеплойте функцию:**
   ```bash
   supabase functions deploy send-telegram-file
   ```

4. **Настройте переменные окружения:**
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN=8139201002:AAGbwoT9GVX5eMQMkxfd4Uu_ZW4mRCOhmTI
   ```

5. **Проверьте статус:**
   ```bash
   supabase functions list
   ```

---

## Проверка работы

После деплоя проверьте функцию:

```bash
curl -X POST \
  'https://hoqyxyggjkidwmmsanec.supabase.co/functions/v1/send-telegram-file' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "chatId": YOUR_TELEGRAM_ID,
    "csvData": "test,data\n1,2",
    "fileName": "test.csv"
  }'
```

Если все работает, вы получите файл в Telegram!

---

## Troubleshooting

### Ошибка "TELEGRAM_BOT_TOKEN is not set"
- Убедитесь, что переменная окружения настроена в Dashboard
- Или используйте fallback из кода (уже настроен)

### Ошибка "Function not found"
- Проверьте, что функция успешно задеплоена
- Проверьте имя функции: должно быть `send-telegram-file`

### Файл не приходит в Telegram
- Проверьте chat_id пользователя
- Убедитесь, что бот написал первое сообщение пользователю
- Проверьте токен бота
