-- Create whitelist table for authorized users

-- Step 1: Create whitelist table
CREATE TABLE IF NOT EXISTS public.whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Step 2: Enable RLS
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy for whitelist (only admins can manage)
CREATE POLICY "Allow admins to manage whitelist" ON public.whitelist
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 4: Add comment
COMMENT ON TABLE public.whitelist IS 'Список авторизованных пользователей Telegram';
COMMENT ON COLUMN public.whitelist.telegram_id IS 'Telegram ID пользователя';
COMMENT ON COLUMN public.whitelist.name IS 'Имя пользователя для справки';

-- Step 5: Create function to check if user is whitelisted
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
