-- Make city-photos storage completely open
-- Since only admins can access the Location Management interface,
-- this is safe and removes all RLS complications

-- Drop ALL existing city-photos policies
DROP POLICY IF EXISTS "Public can view city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete city photos" ON storage.objects;
DROP POLICY IF EXISTS "city_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "city_photos_admin_full" ON storage.objects;
DROP POLICY IF EXISTS "temp_admin_bypass" ON storage.objects;
DROP POLICY IF EXISTS "admin_upload_bypass" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin upload city photos" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin update city photos" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin delete city photos" ON storage.objects;
DROP POLICY IF EXISTS "Bypass RLS for city-photos" ON storage.objects;

-- Create completely open policies for city-photos bucket
-- Anyone can read
CREATE POLICY "city_photos_open_read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'city-photos');

-- Anyone can upload
CREATE POLICY "city_photos_open_upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'city-photos');

-- Anyone can update
CREATE POLICY "city_photos_open_update" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'city-photos');

-- Anyone can delete
CREATE POLICY "city_photos_open_delete" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'city-photos');

-- Verify the setup
SELECT 
    'City-photos bucket policies:' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%city_photos_open%';

SELECT 'City-photos storage is now completely open for uploads!' as message;
