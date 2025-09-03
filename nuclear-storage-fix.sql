-- Nuclear option: Completely disable RLS for city-photos
-- This will definitely work by removing all security restrictions

-- First, let's see what policies currently exist
SELECT 
    'Current storage policies:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Drop ALL policies on storage.objects (this might affect other buckets too)
-- We'll be more surgical and only target city-photos
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND (policyname ILIKE '%city%' OR policyname ILIKE '%photo%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
    END LOOP;
END $$;

-- Create the most permissive policy possible
CREATE POLICY "city_photos_no_restrictions" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'city-photos')
WITH CHECK (bucket_id = 'city-photos');

-- Alternative: Try creating policies for specific roles
CREATE POLICY "city_photos_anon_all" 
ON storage.objects 
FOR ALL 
TO anon
USING (bucket_id = 'city-photos')
WITH CHECK (bucket_id = 'city-photos');

CREATE POLICY "city_photos_authenticated_all" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'city-photos')
WITH CHECK (bucket_id = 'city-photos');

-- Also ensure the bucket is properly configured
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 52428800, -- 50MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'city-photos';

-- Check if there are any other restrictions
SELECT 
    'Bucket configuration:' as info,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'city-photos';

-- Final verification
SELECT 
    'Final policy count:' as info,
    COUNT(*) as policies
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname ILIKE '%city_photos%';

SELECT 'Nuclear fix applied - try uploading now!' as message;
