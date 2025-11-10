-- Extend transactions table to support all action types
-- Drop old constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_action_check;

-- Add new constraint with all action types
ALTER TABLE public.transactions ADD CONSTRAINT transactions_action_check
  CHECK (action IN (
    'взято',
    'возвращено',
    'пополнено',
    'создано',
    'изменено',
    'удалено',
    'категория создана',
    'категория изменена',
    'категория удалена'
  ));

-- Make item_id nullable for category-related actions
ALTER TABLE public.transactions ALTER COLUMN item_id DROP NOT NULL;

-- Add optional fields for additional context
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS details JSONB;

-- Add comment
COMMENT ON TABLE public.transactions IS 'Stores all user actions including item and category operations';
