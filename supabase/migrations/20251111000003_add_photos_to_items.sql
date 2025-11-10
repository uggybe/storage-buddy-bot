-- Add photos field to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.items.photos IS 'Array of photo URLs from Supabase Storage';
