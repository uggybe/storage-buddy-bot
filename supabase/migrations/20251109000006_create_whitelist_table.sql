-- Create whitelist table for authorized users
-- This migration can be run multiple times safely

DO $$
BEGIN
  -- Step 1: Create whitelist table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'whitelist'
  ) THEN
    CREATE TABLE public.whitelist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      telegram_id BIGINT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id)
    );
    RAISE NOTICE 'Created whitelist table';
  ELSE
    RAISE NOTICE 'Whitelist table already exists';
  END IF;

  -- Step 2: Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'whitelist'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on whitelist table';
  END IF;

  -- Step 3: Drop existing policy if it exists, then recreate it
  DROP POLICY IF EXISTS "Allow admins to manage whitelist" ON public.whitelist;

  CREATE POLICY "Allow admins to manage whitelist" ON public.whitelist
    FOR ALL USING (auth.role() = 'authenticated');

  RAISE NOTICE 'Created policy for whitelist table';
END $$;

-- Step 4: Add comments (safe to run multiple times)
COMMENT ON TABLE public.whitelist IS 'Список авторизованных пользователей Telegram';
COMMENT ON COLUMN public.whitelist.telegram_id IS 'Telegram ID пользователя';
COMMENT ON COLUMN public.whitelist.name IS 'Имя пользователя для справки';

-- Step 5: Create function to check if user is whitelisted (safe to run multiple times)
CREATE OR REPLACE FUNCTION public.is_telegram_user_whitelisted(user_telegram_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.whitelist WHERE telegram_id = user_telegram_id
  );
END;
$$;

COMMENT ON FUNCTION public.is_telegram_user_whitelisted IS 'Проверяет, авторизован ли пользователь Telegram';
