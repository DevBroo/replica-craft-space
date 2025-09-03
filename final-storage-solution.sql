-- FINAL SOLUTION: Completely disable RLS for storage.objects
-- This is the nuclear option that will definitely work

-- First, let's see the current state
SELECT 
    'Current RLS status on storage.objects:' as info,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'objects' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Show all current policies on storage.objects
SELECT 
    'Current storage policies:' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- NUCLEAR OPTION: Completely disable RLS on storage.objects
-- WARNING: This removes ALL storage security - only do this if you're sure
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Alternative: Create super permissive policies for all buckets
-- If you don't want to disable RLS completely, uncomment these instead:

-- DROP ALL existing policies first
/*
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
    END LOOP;
END $$;

-- Create one super permissive policy for everything
CREATE POLICY "allow_all_storage" 
ON storage.objects 
FOR ALL 
USING (true)
WITH CHECK (true);
*/

-- Verify the change
SELECT 
    'RLS disabled on storage.objects:' as info,
    NOT relrowsecurity as rls_disabled
FROM pg_class 
WHERE relname = 'objects' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

SELECT 'Storage is now completely open - try uploading!' as message;


