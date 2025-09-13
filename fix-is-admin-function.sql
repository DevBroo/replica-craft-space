-- Fix is_admin() function dependency issue
-- WARNING: This will temporarily disable admin policies
-- Run this ONLY if you need to update the is_admin() function

-- Step 1: Drop all policies that depend on is_admin() function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all day picnic packages" ON public.day_picnic_packages;
DROP POLICY IF EXISTS "Admins can manage all rates" ON public.day_picnic_hourly_rates;
DROP POLICY IF EXISTS "Admins can manage all option prices" ON public.day_picnic_option_prices;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

-- Step 2: Now we can drop and recreate the is_admin() function
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Step 3: Recreate all the admin policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete all profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can manage all day picnic packages" ON public.day_picnic_packages
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage all rates" ON public.day_picnic_hourly_rates
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage all option prices" ON public.day_picnic_option_prices
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all properties" ON public.properties
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete all properties" ON public.properties
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (public.is_admin());

-- Step 4: Test the function
SELECT public.is_admin();
