-- Create table for tracking user name changes from Telegram
CREATE TABLE IF NOT EXISTS public.user_name_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  old_name TEXT NOT NULL,
  new_name TEXT NOT NULL,
  telegram_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_name_changes_user_id ON public.user_name_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_name_changes_created_at ON public.user_name_changes(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_name_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policy - authenticated users can view all name changes
CREATE POLICY "Authenticated users can view name changes"
ON public.user_name_changes FOR SELECT
TO authenticated
USING (true);

-- RLS Policy - authenticated users can insert name changes
CREATE POLICY "Authenticated users can insert name changes"
ON public.user_name_changes FOR INSERT
TO authenticated
WITH CHECK (true);

COMMENT ON TABLE public.user_name_changes IS 'История изменений имен пользователей в Telegram';
COMMENT ON COLUMN public.user_name_changes.user_id IS 'ID пользователя из app_users';
COMMENT ON COLUMN public.user_name_changes.old_name IS 'Старое имя пользователя';
COMMENT ON COLUMN public.user_name_changes.new_name IS 'Новое имя пользователя';
COMMENT ON COLUMN public.user_name_changes.telegram_id IS 'Telegram ID пользователя для справки';
