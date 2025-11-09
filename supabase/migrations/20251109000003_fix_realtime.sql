-- Fix and enable Realtime for items and transactions tables

-- Drop tables from publication if they exist (to avoid errors)
DO $$
BEGIN
    -- Try to drop items from publication
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.items;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Try to drop transactions from publication
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.transactions;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Ensure REPLICA IDENTITY is set correctly for both tables
ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Add comments
COMMENT ON TABLE public.items IS 'Items table with real-time updates enabled';
COMMENT ON TABLE public.transactions IS 'Transactions table with real-time updates enabled';
