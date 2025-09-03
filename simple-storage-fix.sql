-- Simple fix for storage upload issues
-- Since you have admin role, let's create a working policy

-- Drop ALL existing city-photos policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete city photos" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin upload city photos" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin update city photos" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin delete city photos" ON storage.objects;
DROP POLICY IF EXISTS "Bypass RLS for city-photos" ON storage.objects;

-- Create simple, working policies
-- Public read access
CREATE POLICY "city_photos_public_read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'city-photos');

-- Admin full access - simplified approach
CREATE POLICY "city_photos_admin_full" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (
    bucket_id = 'city-photos' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'city-photos' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Also ensure locations table policy works
DROP POLICY IF EXISTS "Locations can be managed by admins" ON public.locations;
DROP POLICY IF EXISTS "Temp locations access" ON public.locations;

CREATE POLICY "locations_admin_manage" ON public.locations
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Verify the setup
SELECT 
    'Bucket exists: ' || CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'city-photos') THEN 'YES' ELSE 'NO' END as status
UNION ALL
SELECT 
    'User is admin: ' || CASE WHEN EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN 'YES' ELSE 'NO' END as status
UNION ALL
SELECT 
    'Storage policies count: ' || COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%city_photos%';
