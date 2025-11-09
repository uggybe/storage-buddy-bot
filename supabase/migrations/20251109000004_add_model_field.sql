-- Add model field to items table

-- Step 1: Add model column
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS model TEXT;

-- Step 2: Add comment
COMMENT ON COLUMN public.items.model IS 'Модель предмета';
