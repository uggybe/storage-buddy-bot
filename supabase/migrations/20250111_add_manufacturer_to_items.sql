-- Add manufacturer field to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS manufacturer TEXT NOT NULL DEFAULT 'Неизвестно';

-- Create manufacturers table for predefined list
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default manufacturers
INSERT INTO public.manufacturers (name) VALUES
  ('Apple'),
  ('Samsung'),
  ('Xiaomi'),
  ('Huawei'),
  ('Google'),
  ('OnePlus'),
  ('Sony'),
  ('LG'),
  ('Motorola'),
  ('Nokia'),
  ('Другое')
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON COLUMN public.items.manufacturer IS 'Производитель товара';
COMMENT ON TABLE public.manufacturers IS 'Список производителей';
