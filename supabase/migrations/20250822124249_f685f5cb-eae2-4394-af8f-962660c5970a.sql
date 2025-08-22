-- First, fix any existing profiles with invalid roles
UPDATE public.profiles 
SET role = 'user' 
WHERE role NOT IN ('user', 'agent', 'admin', 'property_owner');

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function as VOLATILE (not STABLE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile with error handling to prevent signup failures
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IN ('user', 'agent', 'admin', 'property_owner') 
      THEN NEW.raw_user_meta_data->>'role'
      ELSE 'user'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing users who don't have profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    CASE 
      WHEN au.raw_user_meta_data->>'first_name' IS NOT NULL AND au.raw_user_meta_data->>'last_name' IS NOT NULL 
      THEN CONCAT(au.raw_user_meta_data->>'first_name', ' ', au.raw_user_meta_data->>'last_name')
      ELSE au.raw_user_meta_data->>'first_name'
    END,
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  CASE 
    WHEN au.raw_user_meta_data->>'role' IN ('user', 'agent', 'admin', 'property_owner') 
    THEN au.raw_user_meta_data->>'role'
    ELSE 'user'
  END,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;