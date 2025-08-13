-- Fix Missing Profiles Issue
-- This script creates missing profiles for property owners and admin user

-- Step 1: Temporarily disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create admin user profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  phone,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@picnify.com',
  'Picnify Admin',
  'admin',
  null,
  null,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Step 3: Create profiles for all property owners
-- First, get all unique owner IDs from properties table
WITH unique_owners AS (
  SELECT DISTINCT owner_id 
  FROM public.properties 
  WHERE owner_id NOT IN (SELECT id FROM public.profiles)
)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  phone,
  avatar_url,
  created_at,
  updated_at
)
SELECT 
  owner_id,
  'owner-' || substring(owner_id::text, 1, 8) || '@picnify.com',
  'Property Owner (' || substring(owner_id::text, 1, 8) || ')',
  'property_owner',
  null,
  null,
  now(),
  now()
FROM unique_owners
ON CONFLICT (id) DO NOTHING;

-- Step 4: Re-enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix
SELECT 
  'Profiles created' as status,
  COUNT(*) as count
FROM public.profiles;

SELECT 
  'Properties with matching profiles' as status,
  COUNT(*) as count
FROM public.properties p
JOIN public.profiles pr ON p.owner_id = pr.id;

SELECT 
  'Properties without matching profiles' as status,
  COUNT(*) as count
FROM public.properties p
LEFT JOIN public.profiles pr ON p.owner_id = pr.id
WHERE pr.id IS NULL;
