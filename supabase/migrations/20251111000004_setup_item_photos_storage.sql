-- Create storage bucket for item photos if not exists
-- Note: This migration only ensures the bucket exists.
-- Storage policies must be configured through Supabase Dashboard or using the storage API.

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE storage.buckets IS 'Storage bucket for item photos - configure RLS policies via Dashboard';
