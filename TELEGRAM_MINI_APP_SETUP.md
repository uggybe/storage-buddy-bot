# Настройка Telegram Mini App

## Шаг 1: Создание бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите название вашего бота (например: "Storage Buddy Bot")
4. Введите username бота (например: `storage_buddy_bot`)
5. Сохраните токен бота, который выдаст BotFather

## Шаг 2: Настройка Mini App

1. Отправьте команду `/newapp` в @BotFather
2. Выберите созданного бота из списка
3. Введите название приложения: **Storage Buddy**
4. Введите описание: **Система управления складским учетом**
5. Загрузите фото (512x512 px, можно пропустить)
6. Загрузите GIF демо (необязательно, можно пропустить)
7. **ВАЖНО:** Когда BotFather попросит указать URL, введите ваш URL с Vercel:
   ```
   https://ваш-проект.vercel.app
   ```
   Например: `https://storage-buddy-bot.vercel.app`

## Шаг 3: Примените изменения

После того, как вы создадите Pull Request и смержите его в main:

1. **Примените миграции в Supabase:**

   Откройте SQL Editor: https://supabase.com/dashboard/project/hoqyxyggjkidwmmsanec/sql/new

   Выполните эти два SQL запроса:

   **Первый запрос** (исправление регистрации):
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
   RETURNS trigger
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   DECLARE
     user_name TEXT;
     name_exists BOOLEAN;
     counter INTEGER := 0;
   BEGIN
     user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
     SELECT EXISTS (SELECT 1 FROM public.app_users WHERE name = user_name) INTO name_exists;

     WHILE name_exists LOOP
       counter := counter + 1;
       user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || counter::TEXT;
       SELECT EXISTS (SELECT 1 FROM public.app_users WHERE name = user_name) INTO name_exists;
     END LOOP;

     INSERT INTO public.app_users (user_id, name)
     VALUES (NEW.id, user_name);

     RETURN NEW;
   END;
   $$;
   ```

   **Второй запрос** (добавление поля location):
   ```sql
   ALTER TABLE public.items
   ADD COLUMN IF NOT EXISTS location TEXT;

   COMMENT ON COLUMN public.items.location IS 'Местоположение предмета на складе';
   ```

2. **Дождитесь деплоя на Vercel** (происходит автоматически после merge в main)

## Шаг 4: Запуск Mini App

После завершения всех шагов:

1. Откройте вашего бота в Telegram
2. Нажмите на иконку меню (три полоски) рядом с полем ввода сообщения
3. Выберите ваше Mini App из списка
4. Приложение откроется внутри Telegram!

## Дополнительная настройка (опционально)

### Настройка меню бота

Отправьте команду `/setmenubutton` в @BotFather:
1. Выберите вашего бота
2. Введите текст для кнопки меню: **Открыть склад**
3. Введите URL вашего приложения

### Настройка описания

Отправьте команду `/setdescription` в @BotFather:
```
Система управления складским учетом ЦЭПП Services.
Отслеживайте предметы на складах, берите и возвращайте инструменты, пополняйте запасы.
```

### Настройка короткого описания

Отправьте команду `/setabouttext` в @BotFather:
```
Управление складским учетом ЦЭПП Services
```

## Возможности Telegram Mini App

После настройки ваше приложение:
- ✅ Открывается внутри Telegram
- ✅ Автоматически подстраивается под тему Telegram (светлая/темная)
- ✅ Работает на всех платформах (iOS, Android, Desktop, Web)
- ✅ Доступно всем пользователям Telegram
- ✅ Поддерживает уведомления через бота

## Поддержка

Если возникли проблемы:
1. Проверьте, что URL в Mini App настройках указан правильно
2. Убедитесь, что приложение задеплоено на Vercel
3. Проверьте, что миграции применены в Supabase
4. Попробуйте переоткрыть Mini App в Telegram
