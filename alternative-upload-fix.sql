-- Alternative approach: Create a new bucket or use existing one
-- Sometimes the city-photos bucket has hidden issues

-- Option 1: Create a completely new bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'location-images', 
    'location-images', 
    true, 
    52428800,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create super simple policies for the new bucket
CREATE POLICY "location_images_public_read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'location-images');

CREATE POLICY "location_images_public_write" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "location_images_public_update" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'location-images');

CREATE POLICY "location_images_public_delete" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'location-images');

-- Option 2: Check if we can use an existing bucket
SELECT 
    'Available buckets:' as info,
    id,
    name,
    public
FROM storage.buckets 
WHERE public = true;

-- Option 3: Completely disable RLS on storage.objects table (DANGEROUS but works)
-- Uncomment the line below ONLY if nothing else works
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

SELECT 'Alternative bucket "location-images" created. Update your code to use this bucket instead.' as message;


