-- Fix registration error: handle duplicate names
-- This migration fixes the handle_new_auth_user function to avoid duplicate names

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
  -- Get base name from metadata or email
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- Check if name already exists
  SELECT EXISTS (SELECT 1 FROM public.app_users WHERE name = user_name) INTO name_exists;

  -- If name exists, append a number to make it unique
  WHILE name_exists LOOP
    counter := counter + 1;
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || counter::TEXT;
    SELECT EXISTS (SELECT 1 FROM public.app_users WHERE name = user_name) INTO name_exists;
  END LOOP;

  -- Insert with unique name
  INSERT INTO public.app_users (user_id, name)
  VALUES (NEW.id, user_name);

  RETURN NEW;
END;
$$;
