-- Create storage bucket for item photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload item photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to item photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their item photos" ON storage.objects;

-- Policy: Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload item photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-photos'
);

-- Policy: Allow public read access to photos (so anyone can view)
CREATE POLICY "Allow public read access to item photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-photos');

-- Policy: Allow authenticated users to delete photos
CREATE POLICY "Allow authenticated users to delete their item photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-photos');

-- Policy: Allow authenticated users to update photos
CREATE POLICY "Allow authenticated users to update item photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-photos')
WITH CHECK (bucket_id = 'item-photos');
