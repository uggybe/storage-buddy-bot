-- Fix whitelist permissions to allow anonymous access
-- This migration can be run multiple times safely

-- Step 1: Update whitelist RLS policies to allow anonymous read access
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Allow admins to manage whitelist" ON public.whitelist;
  DROP POLICY IF EXISTS "Allow anonymous to read whitelist" ON public.whitelist;

  -- Allow anyone to read whitelist (needed for login check)
  CREATE POLICY "Allow anonymous to read whitelist" ON public.whitelist
    FOR SELECT USING (true);

  -- Allow authenticated users to manage whitelist
  CREATE POLICY "Allow admins to manage whitelist" ON public.whitelist
    FOR ALL USING (auth.role() = 'authenticated');

  RAISE NOTICE 'Updated whitelist policies';
END $$;

-- Step 2: Ensure RPC function has correct permissions
-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.is_telegram_user_whitelisted TO anon;
GRANT EXECUTE ON FUNCTION public.is_telegram_user_whitelisted TO authenticated;

COMMENT ON FUNCTION public.is_telegram_user_whitelisted IS 'Проверяет, авторизован ли пользователь Telegram (доступно для анонимных пользователей)';
