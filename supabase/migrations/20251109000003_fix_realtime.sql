-- Fix and enable Realtime for items and transactions tables
-- This migration can be run multiple times safely

DO $$
BEGIN
  -- Step 1: Add items table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
    RAISE NOTICE 'Added items table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'Items table already in supabase_realtime publication';
  END IF;

  -- Step 2: Add transactions table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    RAISE NOTICE 'Added transactions table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'Transactions table already in supabase_realtime publication';
  END IF;
END $$;

-- Step 3: Ensure REPLICA IDENTITY is set correctly for both tables (safe to run multiple times)
ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Step 4: Add comments (safe to run multiple times)
COMMENT ON TABLE public.items IS 'Items table with real-time updates enabled';
COMMENT ON TABLE public.transactions IS 'Transactions table with real-time updates enabled';
