-- Fix trigger to use names from whitelist table instead of Telegram metadata
-- This ensures that names are always taken from whitelist (first_name + last_name)

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  telegram_id_value BIGINT;
  user_first_name TEXT;
  user_last_name TEXT;
  combined_name TEXT;
BEGIN
  -- Extract telegram_id from user metadata
  telegram_id_value := (NEW.raw_user_meta_data->>'telegram_id')::BIGINT;

  -- If telegram_id exists, try to get name from whitelist
  IF telegram_id_value IS NOT NULL THEN
    SELECT first_name, last_name
    INTO user_first_name, user_last_name
    FROM public.whitelist
    WHERE telegram_id = telegram_id_value;

    -- Combine first_name and last_name
    -- If last_name exists, format as "last_name first_name"
    -- Otherwise just use first_name
    IF user_last_name IS NOT NULL AND user_last_name != '' THEN
      combined_name := user_last_name || ' ' || COALESCE(user_first_name, '');
    ELSE
      combined_name := COALESCE(user_first_name, '');
    END IF;

    -- Trim any extra spaces
    combined_name := TRIM(combined_name);
  END IF;

  -- Fallback to metadata name if whitelist lookup failed
  IF combined_name IS NULL OR combined_name = '' THEN
    combined_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  END IF;

  -- Insert into app_users
  INSERT INTO public.app_users (user_id, name)
  VALUES (NEW.id, combined_name);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user IS 'Auto-creates app_users entry with name from whitelist (last_name + first_name)';
