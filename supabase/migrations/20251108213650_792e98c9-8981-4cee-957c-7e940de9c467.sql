-- Fix authentication and RLS security issues

-- Step 1: Link app_users to auth.users
ALTER TABLE public.app_users 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id unique to ensure one-to-one mapping
ALTER TABLE public.app_users 
ADD CONSTRAINT app_users_user_id_key UNIQUE (user_id);

-- Step 2: Update app_users RLS policies to use auth.uid()
DROP POLICY IF EXISTS "Anyone can insert users" ON public.app_users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.app_users;

CREATE POLICY "Users can view all app users"
ON public.app_users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can insert users"
ON public.app_users FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 3: Update items RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can view items" ON public.items;
DROP POLICY IF EXISTS "Anyone can insert items" ON public.items;
DROP POLICY IF EXISTS "Anyone can update items" ON public.items;
DROP POLICY IF EXISTS "Anyone can delete items" ON public.items;

CREATE POLICY "Authenticated users can view items"
ON public.items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert items"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
ON public.items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete items"
ON public.items FOR DELETE
TO authenticated
USING (true);

-- Step 4: Update transactions RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.transactions;

CREATE POLICY "Authenticated users can view transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 5: Create trigger to auto-create app_users entry when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (user_id, name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();