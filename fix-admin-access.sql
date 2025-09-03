-- Fix admin access for location management
-- Run this in Supabase SQL editor

-- First, let's ensure your user has admin role in profiles table
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL

-- Alternative: Set admin role for current authenticated user
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Create a more permissive temporary policy for testing
-- This allows any authenticated user to upload to city-photos bucket
DROP POLICY IF EXISTS "Temp admin upload city photos" ON storage.objects;

CREATE POLICY "Temp admin upload city photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'city-photos');

-- Also create permissive policies for update and delete
DROP POLICY IF EXISTS "Temp admin update city photos" ON storage.objects;
DROP POLICY IF EXISTS "Temp admin delete city photos" ON storage.objects;

CREATE POLICY "Temp admin update city photos" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'city-photos');

CREATE POLICY "Temp admin delete city photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'city-photos');

-- Make locations table accessible to authenticated users temporarily
DROP POLICY IF EXISTS "Temp locations access" ON public.locations;

CREATE POLICY "Temp locations access" ON public.locations
FOR ALL 
TO authenticated
USING (true);

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('city-photos', 'city-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Check if everything is working
SELECT 
    'User ID: ' || auth.uid()::text as debug_info
UNION ALL
SELECT 
    'User Email: ' || COALESCE(auth.email(), 'No email') as debug_info
UNION ALL
SELECT 
    'Profile Role: ' || COALESCE(p.role, 'No profile found') as debug_info
FROM public.profiles p 
WHERE p.id = auth.uid()
UNION ALL
SELECT 
    'is_admin() result: ' || COALESCE(public.is_admin()::text, 'Function not found') as debug_info
UNION ALL
SELECT 
    'Bucket exists: ' || CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'city-photos') THEN 'YES' ELSE 'NO' END as debug_info;


