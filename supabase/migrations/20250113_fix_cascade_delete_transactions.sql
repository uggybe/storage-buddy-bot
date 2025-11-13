-- Remove CASCADE delete constraint from transactions.item_id
-- This will allow transactions to remain even when items are deleted

-- Drop existing foreign key constraint
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_item_id_fkey;

-- Add new foreign key constraint with SET NULL instead of CASCADE
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES public.items(id)
ON DELETE SET NULL;

-- Make item_id nullable to support this change
ALTER TABLE public.transactions
ALTER COLUMN item_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN public.transactions.item_id IS 'ID предмета (может быть NULL если предмет удален)';
