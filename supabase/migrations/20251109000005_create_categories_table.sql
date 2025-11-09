-- Create categories table with critical_quantity

-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  critical_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy for categories (anyone can read, authenticated users can manage)
CREATE POLICY "Allow read access to categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert categories" ON public.categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update categories" ON public.categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete categories" ON public.categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Step 4: Migrate existing categories from items table
INSERT INTO public.categories (name, critical_quantity)
SELECT DISTINCT category, 0
FROM public.items
WHERE category IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Step 5: Add comment
COMMENT ON TABLE public.categories IS 'Категории предметов с настройками минимального количества';
COMMENT ON COLUMN public.categories.name IS 'Название категории';
COMMENT ON COLUMN public.categories.critical_quantity IS 'Минимальное количество для всех предметов этой категории';

-- Step 6: Enable Realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
