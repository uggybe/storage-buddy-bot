-- Fix app_users insert policy for trigger
-- The trigger needs to be able to insert into app_users table

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Service role can insert users" ON public.app_users;

-- Allow inserts from trigger (SECURITY DEFINER functions have elevated privileges)
CREATE POLICY "Allow trigger to insert users"
ON public.app_users FOR INSERT
WITH CHECK (true);

-- Also ensure the function is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- Recreate function with proper error handling
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
  BEGIN
    INSERT INTO public.app_users (user_id, name)
    VALUES (NEW.id, user_name);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error inserting app_user: %', SQLERRM;
    RAISE;
  END;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.app_users TO postgres, service_role;

COMMENT ON FUNCTION public.handle_new_auth_user IS 'Auto-creates app_users entry when auth user is created (with error handling)';
