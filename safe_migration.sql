-- Safe migration - applies only missing parts
-- This version checks for existing objects before creating them

-- Step 1: Create item_type enum (skip if exists)
DO $$ BEGIN
    CREATE TYPE public.item_type AS ENUM ('единичный', 'множественный');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add item_type column (if not exists)
DO $$ BEGIN
    ALTER TABLE public.items
    ADD COLUMN item_type public.item_type NOT NULL DEFAULT 'множественный';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 3: Add current_user_id (if not exists)
DO $$ BEGIN
    ALTER TABLE public.items
    ADD COLUMN current_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 4: Add index (if not exists)
CREATE INDEX IF NOT EXISTS idx_items_current_user ON public.items(current_user_id);

-- Step 5: Add comments (safe to run multiple times)
COMMENT ON COLUMN public.items.item_type IS 'Тип предмета: единичный (не требует количества) или множественный (с количеством)';
COMMENT ON COLUMN public.items.current_user_id IS 'Текущий пользователь, который взял единичный предмет';

-- Step 6: Create/Replace function (safe to run multiple times)
CREATE OR REPLACE FUNCTION public.update_item_current_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Get the item information
  SELECT item_type INTO item_record FROM items WHERE id = NEW.item_id;

  -- Only update current_user_id for single items
  IF item_record.item_type = 'единичный' THEN
    IF NEW.action = 'взято' THEN
      -- Set current user when item is taken
      UPDATE items SET current_user_id = NEW.user_id WHERE id = NEW.item_id;
    ELSIF NEW.action = 'возвращено' THEN
      -- Clear current user when item is returned
      UPDATE items SET current_user_id = NULL WHERE id = NEW.item_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 7: Drop and recreate trigger (safe approach)
DROP TRIGGER IF EXISTS update_item_current_user_on_transaction ON public.transactions;

CREATE TRIGGER update_item_current_user_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_item_current_user();

-- Verify everything is in place
DO $$
DECLARE
  has_item_type BOOLEAN;
  has_current_user_id BOOLEAN;
  has_trigger BOOLEAN;
BEGIN
  -- Check for columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'item_type'
  ) INTO has_item_type;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'current_user_id'
  ) INTO has_current_user_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_item_current_user_on_transaction'
  ) INTO has_trigger;

  -- Report status
  RAISE NOTICE '✓ item_type column: %', CASE WHEN has_item_type THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '✓ current_user_id column: %', CASE WHEN has_current_user_id THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '✓ trigger: %', CASE WHEN has_trigger THEN 'EXISTS' ELSE 'MISSING' END;

  IF has_item_type AND has_current_user_id AND has_trigger THEN
    RAISE NOTICE '🎉 Migration completed successfully!';
  ELSE
    RAISE WARNING '⚠️ Some components are missing. Please check the logs.';
  END IF;
END $$;
