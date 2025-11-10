-- Проверка таблицы categories и её permissions

-- 1. Проверить существует ли таблица
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'categories'
) AS table_exists;

-- 2. Проверить структуру таблицы
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories';

-- 3. Проверить RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'categories';

-- 4. Проверить существующие категории
SELECT * FROM public.categories;

-- 5. Проверить RLS включен ли
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'categories';

-- 6. Попробовать вставить тестовую категорию (если таблица существует)
-- INSERT INTO public.categories (name, critical_quantity)
-- VALUES ('TEST_CATEGORY', 5);

-- 7. Проверить Realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'categories';
