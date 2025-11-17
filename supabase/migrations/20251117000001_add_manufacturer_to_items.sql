-- Add manufacturer field to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS manufacturer TEXT NOT NULL DEFAULT 'Неизвестно';

-- Add comment
COMMENT ON COLUMN public.items.manufacturer IS 'Производитель товара';
