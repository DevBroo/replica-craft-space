
-- 1) Table: day_picnic_hourly_rates
CREATE TABLE IF NOT EXISTS public.day_picnic_hourly_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.day_picnic_packages(id) ON DELETE CASCADE,
  meal_plan text NOT NULL,
  hour_number integer NOT NULL CHECK (hour_number > 0),
  price_per_person numeric NOT NULL DEFAULT 0,
  price_per_package numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, meal_plan, hour_number)
);

CREATE INDEX IF NOT EXISTS idx_day_picnic_hourly_rates_package_id
  ON public.day_picnic_hourly_rates (package_id);

-- 2) Table: day_picnic_option_prices
-- Stores both inclusions and add-ons with prices.
CREATE TABLE IF NOT EXISTS public.day_picnic_option_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.day_picnic_packages(id) ON DELETE CASCADE,
  option_type text NOT NULL CHECK (option_type IN ('inclusion','add_on')),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, option_type, name)
);

CREATE INDEX IF NOT EXISTS idx_day_picnic_option_prices_package_id
  ON public.day_picnic_option_prices (package_id);

-- 3) Optional: min_hours on packages (default 1)
ALTER TABLE public.day_picnic_packages
  ADD COLUMN IF NOT EXISTS min_hours integer NOT NULL DEFAULT 1;

-- 4) RLS for day_picnic_hourly_rates
ALTER TABLE public.day_picnic_hourly_rates ENABLE ROW LEVEL SECURITY;

-- Admins manage all
DROP POLICY IF EXISTS "Admins can manage all rates" ON public.day_picnic_hourly_rates;
CREATE POLICY "Admins can manage all rates"
  ON public.day_picnic_hourly_rates
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Owners: SELECT
DROP POLICY IF EXISTS "Owners can view their rates" ON public.day_picnic_hourly_rates;
CREATE POLICY "Owners can view their rates"
  ON public.day_picnic_hourly_rates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_hourly_rates.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners: INSERT
DROP POLICY IF EXISTS "Owners can create their rates" ON public.day_picnic_hourly_rates;
CREATE POLICY "Owners can create their rates"
  ON public.day_picnic_hourly_rates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_hourly_rates.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners: UPDATE
DROP POLICY IF EXISTS "Owners can update their rates" ON public.day_picnic_hourly_rates;
CREATE POLICY "Owners can update their rates"
  ON public.day_picnic_hourly_rates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_hourly_rates.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners: DELETE
DROP POLICY IF EXISTS "Owners can delete their rates" ON public.day_picnic_hourly_rates;
CREATE POLICY "Owners can delete their rates"
  ON public.day_picnic_hourly_rates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_hourly_rates.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Public can view rates for approved properties
DROP POLICY IF EXISTS "Public can view rates for approved properties" ON public.day_picnic_hourly_rates;
CREATE POLICY "Public can view rates for approved properties"
  ON public.day_picnic_hourly_rates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_hourly_rates.package_id
        AND p.status = 'approved'
    )
  );

-- 5) RLS for day_picnic_option_prices
ALTER TABLE public.day_picnic_option_prices ENABLE ROW LEVEL SECURITY;

-- Admins manage all
DROP POLICY IF EXISTS "Admins can manage all option prices" ON public.day_picnic_option_prices;
CREATE POLICY "Admins can manage all option prices"
  ON public.day_picnic_option_prices
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Owners: SELECT
DROP POLICY IF EXISTS "Owners can view their option prices" ON public.day_picnic_option_prices;
CREATE POLICY "Owners can view their option prices"
  ON public.day_picnic_option_prices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_option_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners: INSERT
DROP POLICY IF EXISTS "Owners can create their option prices" ON public.day_picnic_option_prices;
CREATE POLICY "Owners can create their option prices"
  ON public.day_picnic_option_prices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_option_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners: UPDATE
DROP POLICY IF EXISTS "Owners can update their option prices" ON public.day_picnic_option_prices;
CREATE POLICY "Owners can update their option prices"
  ON public.day_picnic_option_prices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_option_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Owners: DELETE
DROP POLICY IF EXISTS "Owners can delete their option prices" ON public.day_picnic_option_prices;
CREATE POLICY "Owners can delete their option prices"
  ON public.day_picnic_option_prices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_option_prices.package_id
        AND p.owner_id = auth.uid()
    )
  );

-- Public can view option prices for approved properties
DROP POLICY IF EXISTS "Public can view option prices for approved properties" ON public.day_picnic_option_prices;
CREATE POLICY "Public can view option prices for approved properties"
  ON public.day_picnic_option_prices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.day_picnic_packages pkg
      JOIN public.properties p ON p.id = pkg.property_id
      WHERE pkg.id = day_picnic_option_prices.package_id
        AND p.status = 'approved'
    )
  );
