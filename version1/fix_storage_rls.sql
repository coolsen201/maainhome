-- 1. Create the 'assets' storage bucket if it doesn't exist
-- Note: If this fails, you can also create the bucket manually in the Supabase UI under 'Storage'
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policies for the 'assets' bucket
-- (We skip 'ALTER TABLE' because it's usually already enabled and requires superuser)

-- Drop existing policies if they exist to avoid 'already exists' errors
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletions" ON storage.objects;

-- Allow public read access (for displaying photos)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- Allow everyone (or authenticated) to upload to the assets bucket
CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assets');

-- Allow updates (for upsert/overwriting)
CREATE POLICY "Allow Updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assets');

-- Allow deletions
CREATE POLICY "Allow Deletions"
ON storage.objects FOR DELETE
USING (bucket_id = 'assets');
