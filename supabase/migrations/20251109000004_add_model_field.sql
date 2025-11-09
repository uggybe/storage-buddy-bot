-- Add model field to items table
-- This migration can be run multiple times safely

DO $$
BEGIN
  -- Step 1: Add model column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'items'
    AND column_name = 'model'
  ) THEN
    ALTER TABLE public.items ADD COLUMN model TEXT;
    RAISE NOTICE 'Added model column to items table';
  ELSE
    RAISE NOTICE 'Model column already exists in items table';
  END IF;
END $$;

-- Step 2: Add comment (safe to run multiple times)
COMMENT ON COLUMN public.items.model IS 'Модель предмета';
