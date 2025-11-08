-- Fix function search path security issue by recreating with proper settings
DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
DROP FUNCTION IF EXISTS public.update_updated_at();

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

-- Recreate trigger
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();