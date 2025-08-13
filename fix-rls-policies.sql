-- Fix RLS Policies for Profile Creation
-- This script will allow the anonymous user to create profiles

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all profile operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Step 2: Create completely permissive policies for profiles
CREATE POLICY "Allow all profile operations for anonymous" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Step 3: Grant necessary permissions to anonymous role
GRANT ALL ON public.profiles TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Step 4: Ensure the profiles table allows inserts from anonymous users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create a function to handle profile creation with elevated privileges
CREATE OR REPLACE FUNCTION public.create_profile_safe(
  profile_id UUID,
  profile_email TEXT,
  profile_name TEXT,
  profile_role TEXT DEFAULT 'property_owner'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    profile_id,
    profile_email,
    profile_name,
    profile_role,
    null,
    null,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Step 6: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_profile_safe(UUID, TEXT, TEXT, TEXT) TO anon;

-- Step 7: Verify the policies
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
WHERE tablename = 'profiles';
