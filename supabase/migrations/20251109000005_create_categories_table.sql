-- Create categories table with critical_quantity
-- This migration can be run multiple times safely

DO $$
BEGIN
  -- Step 1: Create categories table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'categories'
  ) THEN
    CREATE TABLE public.categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      critical_quantity INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created categories table';
  ELSE
    RAISE NOTICE 'Categories table already exists';
  END IF;

  -- Step 2: Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'categories'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on categories table';
  END IF;

  -- Step 3: Drop existing policies if they exist, then recreate them
  DROP POLICY IF EXISTS "Allow read access to categories" ON public.categories;
  DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
  DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
  DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categories;

  CREATE POLICY "Allow read access to categories" ON public.categories
    FOR SELECT USING (true);

  CREATE POLICY "Allow authenticated users to insert categories" ON public.categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  CREATE POLICY "Allow authenticated users to update categories" ON public.categories
    FOR UPDATE USING (auth.role() = 'authenticated');

  CREATE POLICY "Allow authenticated users to delete categories" ON public.categories
    FOR DELETE USING (auth.role() = 'authenticated');

  RAISE NOTICE 'Created policies for categories table';
END $$;

-- Step 4: Migrate existing categories from items table (safe to run multiple times)
INSERT INTO public.categories (name, critical_quantity)
SELECT DISTINCT category, 0
FROM public.items
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;

-- Step 5: Add comments (safe to run multiple times)
COMMENT ON TABLE public.categories IS 'Категории предметов с настройками минимального количества';
COMMENT ON COLUMN public.categories.name IS 'Название категории';
COMMENT ON COLUMN public.categories.critical_quantity IS 'Минимальное количество для всех предметов этой категории';

-- Step 6: Enable Realtime for categories (with error handling)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    RAISE NOTICE 'Added categories table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'Categories table already in supabase_realtime publication';
  END IF;
END $$;
