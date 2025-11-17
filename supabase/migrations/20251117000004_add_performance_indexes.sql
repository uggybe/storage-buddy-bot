-- Add indexes for better query performance

-- Items table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);
CREATE INDEX IF NOT EXISTS idx_items_manufacturer ON public.items(manufacturer);
CREATE INDEX IF NOT EXISTS idx_items_model ON public.items(model);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_action ON public.transactions(action);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_warehouse_category ON public.items(warehouse, category);
CREATE INDEX IF NOT EXISTS idx_items_category_warehouse ON public.items(category, warehouse);

-- Add comments
COMMENT ON INDEX idx_items_name IS 'Ускоряет поиск по названию';
COMMENT ON INDEX idx_items_manufacturer IS 'Ускоряет поиск по производителю';
COMMENT ON INDEX idx_items_model IS 'Ускоряет поиск по модели';
COMMENT ON INDEX idx_items_created_at IS 'Ускоряет сортировку по дате создания';
COMMENT ON INDEX idx_transactions_created_at IS 'Ускоряет выборку последних транзакций';
COMMENT ON INDEX idx_transactions_action IS 'Ускоряет фильтрацию по типу действия';
COMMENT ON INDEX idx_items_warehouse_category IS 'Ускоряет фильтрацию по складу и категории';
