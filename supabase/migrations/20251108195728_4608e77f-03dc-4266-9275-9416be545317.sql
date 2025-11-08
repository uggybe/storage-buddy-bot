-- Create warehouses enum
CREATE TYPE public.warehouse_type AS ENUM ('Мастерская', 'Холодный', 'Теплый');

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  warehouse warehouse_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  critical_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table for tracking who takes items
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table for tracking item movements
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('взято', 'возвращено')),
  quantity INTEGER NOT NULL DEFAULT 1,
  purpose TEXT,
  location_details TEXT,
  warehouse_returned warehouse_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_items_warehouse ON public.items(warehouse);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_transactions_item ON public.transactions(item_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for mini-app)
CREATE POLICY "Anyone can view items"
  ON public.items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert items"
  ON public.items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update items"
  ON public.items FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete items"
  ON public.items FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view users"
  ON public.app_users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON public.app_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view transactions"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for items
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();