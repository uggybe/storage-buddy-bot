-- Add manufacturer field to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS manufacturer TEXT NOT NULL DEFAULT 'Неизвестно';

-- Create manufacturers table for custom list
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment
COMMENT ON COLUMN public.items.manufacturer IS 'Производитель товара';
COMMENT ON TABLE public.manufacturers IS 'Список производителей (заполняется вручную)';
