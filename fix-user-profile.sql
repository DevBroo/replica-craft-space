-- Fix Missing User Profile for mshimavarsha07@gmail.com
-- This script will create the missing user profile in the profiles table

-- Step 1: Temporarily disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Insert the missing user profile
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
    '67af3277-e025-4cca-a504-b4f2d723f7ca',
    'mshimavarsha07@gmail.com',
    'Mshimavarsha',
    'property_owner',
    NULL,
    NULL,
    '2025-08-12T16:12:04.132798+00:00',
    '2025-08-12T18:19:13.880925+00:00'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Step 3: Re-enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the profile was created
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE id = '67af3277-e025-4cca-a504-b4f2d723f7ca';

-- Step 5: Check total property owners count
SELECT 
    COUNT(*) as total_property_owners,
    COUNT(CASE WHEN role = 'property_owner' THEN 1 END) as property_owners
FROM public.profiles;

-- Step 6: Check properties for this owner
SELECT 
    COUNT(*) as properties_count
FROM public.properties 
WHERE owner_id = '67af3277-e025-4cca-a504-b4f2d723f7ca';
