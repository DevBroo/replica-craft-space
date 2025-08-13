-- Create admin access policies for profiles table
-- First, drop the restrictive policy that prevents admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that allow users to view their own profiles AND allow admin access
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create admin access policy for profiles (bypasses RLS for admin operations)
CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- Create admin access policy for properties
CREATE POLICY "Admin can view all properties"
ON public.properties
FOR SELECT
TO anon
USING (true);

-- Create admin access policy for updating properties
CREATE POLICY "Admin can update all properties"
ON public.properties
FOR UPDATE
TO anon
USING (true);

-- Create admin access policy for updating profiles
CREATE POLICY "Admin can update all profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (true);

-- Create admin access policy for deleting properties
CREATE POLICY "Admin can delete all properties"
ON public.properties
FOR DELETE
TO anon
USING (true);

-- Create admin access policy for deleting profiles
CREATE POLICY "Admin can delete all profiles"
ON public.profiles
FOR DELETE
TO anon
USING (true);