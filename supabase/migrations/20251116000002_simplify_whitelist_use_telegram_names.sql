-- Simplify whitelist table - only store telegram_id
-- Names will be taken from Telegram metadata automatically

-- Remove first_name and last_name columns from whitelist if they exist
ALTER TABLE public.whitelist DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.whitelist DROP COLUMN IF EXISTS last_name;

-- Update trigger to use Telegram metadata for names
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Get name from Telegram metadata
  -- Format: "first_name last_name" or just "first_name"
  user_name := COALESCE(
    TRIM(
      CONCAT(
        NEW.raw_user_meta_data->>'first_name',
        ' ',
        NEW.raw_user_meta_data->>'last_name'
      )
    ),
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert into app_users
  INSERT INTO public.app_users (user_id, name)
  VALUES (NEW.id, user_name);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user IS 'Auto-creates app_users entry with name from Telegram metadata';
COMMENT ON TABLE public.whitelist IS 'Whitelist of allowed Telegram user IDs - add users like: INSERT INTO whitelist (telegram_id) VALUES (123456789)';
