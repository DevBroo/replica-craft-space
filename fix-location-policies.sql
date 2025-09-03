-- Fix storage policies for city-photos bucket
-- Run this directly in Supabase SQL editor

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can view city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update city photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete city photos" ON storage.objects;

-- Create correct policies using is_admin() function
CREATE POLICY "Public can view city photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'city-photos');

CREATE POLICY "Admins can upload city photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'city-photos' AND public.is_admin());

CREATE POLICY "Admins can update city photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'city-photos' AND public.is_admin());

CREATE POLICY "Admins can delete city photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'city-photos' AND public.is_admin());

-- Ensure the city-photos bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('city-photos', 'city-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Fix locations table RLS policy to use is_admin() function consistently
DROP POLICY IF EXISTS "Locations can be managed by admins" ON public.locations;

CREATE POLICY "Locations can be managed by admins" ON public.locations
FOR ALL USING (public.is_admin());
