-- Debug admin status for current user
-- Run this in Supabase SQL editor to check your admin status

-- Check current user
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- Check if user exists in profiles table and their role
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE id = auth.uid();

-- Test the is_admin() function directly
SELECT public.is_admin() as is_admin_result;

-- Check if user has admin role in user_roles table (if it exists)
SELECT 
    ur.user_id,
    ur.role,
    ur.created_at
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- Check existing storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%city-photos%';

-- Check if city-photos bucket exists
SELECT * FROM storage.buckets WHERE id = 'city-photos';


