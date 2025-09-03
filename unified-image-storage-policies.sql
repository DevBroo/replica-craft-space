-- Unified Image Storage Policies for Properties and Day Picnics
-- This ensures both property and day picnic images use the same storage bucket with proper access control

-- Ensure the public-images bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-images',
  'public-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;

-- Create comprehensive policies for the public-images bucket

-- 1. Public read access for all images (for display on website)
CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public-images');

-- 2. Authenticated users can upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'public-images' 
    AND auth.role() = 'authenticated'
    AND (
      -- Allow uploads to properties folder
      name LIKE 'properties/%'
      -- Allow uploads to covers folder (for location covers)
      OR name LIKE 'covers/%'
      -- Allow uploads to avatars folder (for user avatars)
      OR name LIKE 'avatars/%'
    )
  );

-- 3. Users can update their own uploaded images
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'public-images' 
    AND auth.uid() = owner
  )
  WITH CHECK (
    bucket_id = 'public-images' 
    AND auth.uid() = owner
  );

-- 4. Users can delete their own uploaded images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'public-images' 
    AND auth.uid() = owner
  );

-- 5. Admins have full access to all images
CREATE POLICY "Admins can manage all images" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'public-images' 
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'public-images' 
    AND public.is_admin()
  );

-- Grant necessary permissions
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Create helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
  ON storage.objects(bucket_id, name);

CREATE INDEX IF NOT EXISTS idx_storage_objects_owner 
  ON storage.objects(owner);

-- Add helpful function to get image URL
CREATE OR REPLACE FUNCTION public.get_image_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN bucket_name IS NULL OR file_path IS NULL THEN NULL
      ELSE 'https://' || current_setting('app.settings.supabase_url', true) || '/storage/v1/object/public/' || bucket_name || '/' || file_path
    END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_image_url(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_image_url(text, text) TO authenticated;
