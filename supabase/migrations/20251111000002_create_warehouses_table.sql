-- Create warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to warehouses" ON public.warehouses
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update warehouses" ON public.warehouses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete warehouses" ON public.warehouses
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default warehouses from enum
INSERT INTO public.warehouses (name) VALUES
  ('Мастерская'),
  ('Холодный'),
  ('Теплый')
ON CONFLICT (name) DO NOTHING;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouses;

COMMENT ON TABLE public.warehouses IS 'Список складов';
