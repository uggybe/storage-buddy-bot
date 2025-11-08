-- Add item_type enum and current_user_id field

-- Step 1: Create item_type enum
CREATE TYPE public.item_type AS ENUM ('единичный', 'множественный');

-- Step 2: Add item_type column to items table
ALTER TABLE public.items
ADD COLUMN item_type public.item_type NOT NULL DEFAULT 'множественный';

-- Step 3: Add current_user_id to track who is using a single item
ALTER TABLE public.items
ADD COLUMN current_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- Step 4: Add index for current_user_id
CREATE INDEX idx_items_current_user ON public.items(current_user_id);

-- Step 5: Add comment to explain the purpose
COMMENT ON COLUMN public.items.item_type IS 'Тип предмета: единичный (не требует количества) или множественный (с количеством)';
COMMENT ON COLUMN public.items.current_user_id IS 'Текущий пользователь, который взял единичный предмет';

-- Step 6: Create function to automatically update current_user_id when item is taken/returned
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

-- Step 7: Create trigger to update current_user_id on transactions
CREATE TRIGGER update_item_current_user_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_item_current_user();
