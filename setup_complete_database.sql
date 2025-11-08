-- ========================================
-- Storage Buddy Bot - Complete Database Setup
-- ========================================
-- This script sets up the entire database from scratch
-- Apply this in Supabase SQL Editor or any PostgreSQL database

-- ========================================
-- MIGRATION 1: Initial Schema
-- ========================================

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

-- ========================================
-- MIGRATION 2: Security Fix - Update Function
-- ========================================

-- Function to update timestamp (with security definer)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for items
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- MIGRATION 3: Authentication & RLS Policies
-- ========================================

-- Step 1: Link app_users to auth.users
ALTER TABLE public.app_users
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id unique to ensure one-to-one mapping
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_user_id_key UNIQUE (user_id);

-- Step 2: Update app_users RLS policies to use auth.uid()
CREATE POLICY "Users can view all app users"
ON public.app_users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can insert users"
ON public.app_users FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 3: Update items RLS policies to require authentication
CREATE POLICY "Authenticated users can view items"
ON public.items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert items"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
ON public.items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete items"
ON public.items FOR DELETE
TO authenticated
USING (true);

-- Step 4: Update transactions RLS policies to require authentication
CREATE POLICY "Authenticated users can view transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 5: Create trigger to auto-create app_users entry when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ========================================
-- MIGRATION 4: Item Types (Single/Multiple)
-- ========================================

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

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Your database is now ready to use with Storage Buddy Bot
-- Don't forget to update your .env file with the new database credentials
