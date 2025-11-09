-- Enable Realtime for items table
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;

-- Enable Realtime for transactions table (for purpose updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Comment
COMMENT ON TABLE public.items IS 'Items table with real-time updates enabled';
COMMENT ON TABLE public.transactions IS 'Transactions table with real-time updates enabled';
