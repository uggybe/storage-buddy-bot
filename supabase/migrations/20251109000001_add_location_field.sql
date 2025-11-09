-- Add location field to items table

-- Step 1: Add location column
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 2: Add comment
COMMENT ON COLUMN public.items.location IS 'Местоположение предмета на складе';
