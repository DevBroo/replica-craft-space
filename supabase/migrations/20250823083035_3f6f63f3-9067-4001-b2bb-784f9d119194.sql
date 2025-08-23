
-- Fix RLS on day_picnic_meal_prices so owners can insert/update/delete their own data

-- 1) Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.day_picnic_meal_prices ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing policies that are causing restrictive behavior
DROP POLICY IF EXISTS "Admins can manage all meal prices" ON public.day_picnic_meal_prices;
DROP POLICY IF EXISTS "Owners can create their meal prices" ON public.day_picnic_meal_prices;
DROP POLICY IF EXISTS "Owners can delete their meal prices" ON public.day_picnic_meal_prices;
DROP POLICY IF EXISTS "Owners can update their meal prices" ON public.day_picnic_meal_prices;
DROP POLICY IF EXISTS "Owners can view their meal prices" ON public.day_picnic_meal_prices;
DROP POLICY IF EXISTS "Public can view meal prices for approved properties" ON public.day_picnic_meal_prices;

-- 3) Recreate permissive policies

-- Admins can manage all meal prices
CREATE POLICY "Admins can manage all meal prices"
  ON public.day_picnic_meal_prices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Owners can insert their meal prices (package must belong to their property)
CREATE POLICY "Owners can create their meal prices"
  ON public.day_picnic_meal_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_meal_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners can update their meal prices
CREATE POLICY "Owners can update their meal prices"
  ON public.day_picnic_meal_prices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_meal_prices.package_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_meal_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners can delete their meal prices
CREATE POLICY "Owners can delete their meal prices"
  ON public.day_picnic_meal_prices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_meal_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners can view their meal prices
CREATE POLICY "Owners can view their meal prices"
  ON public.day_picnic_meal_prices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_meal_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Public can view meal prices for approved properties (read-only)
CREATE POLICY "Public can view meal prices for approved properties"
  ON public.day_picnic_meal_prices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_meal_prices.package_id
        AND p.status = 'approved'
    )
  );
