
-- 1) Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',  -- 'percentage' | 'fixed'
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',            -- 'active' | 'inactive'
  property_ids UUID[],                              -- optional: restrict to certain properties
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique, case-insensitive codes
CREATE UNIQUE INDEX coupons_code_lower_idx ON public.coupons (lower(code));

-- 2) RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admins manage all coupons
CREATE POLICY "Admins can manage all coupons"
  ON public.coupons
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Public can read only active + in-range coupons
CREATE POLICY "Public can read active, valid coupons"
  ON public.coupons
  FOR SELECT
  USING (
    status = 'active'
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_to IS NULL OR valid_to >= now())
  );

-- 3) Keep updated_at fresh
CREATE TRIGGER coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
