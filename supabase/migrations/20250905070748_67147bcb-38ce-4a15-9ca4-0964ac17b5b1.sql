
-- 1) Generated column for customer email and index
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_email text
  GENERATED ALWAYS AS ((booking_details->'customer_details'->>'email')) STORED;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_email_lower
  ON public.bookings (lower(customer_email));

-- 2) Helper to safely read current user's email inside RLS (avoids recursion/policy issues)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- 3) Enable RLS and add policies for reading bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Admins can view all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Admins can view all bookings'
  ) THEN
    CREATE POLICY "Admins can view all bookings"
      ON public.bookings
      FOR SELECT
      USING (public.is_admin());
  END IF;
END$$;

-- Users can view bookings they own by user_id OR by matched email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can view bookings by user_id or email'
  ) THEN
    CREATE POLICY "Users can view bookings by user_id or email"
      ON public.bookings
      FOR SELECT
      USING (
        auth.uid() = user_id
        OR (
          customer_email IS NOT NULL
          AND lower(customer_email) = lower(public.get_current_user_email())
        )
      );
  END IF;
END$$;

-- 4) Function to “claim” historical bookings by email and set user_id
CREATE OR REPLACE FUNCTION public.claim_user_bookings(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_count integer := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_email IS NULL OR length(trim(v_email)) = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.bookings b
     SET user_id = p_user_id
   WHERE b.user_id IS NULL
     AND b.customer_email IS NOT NULL
     AND lower(b.customer_email) = lower(v_email);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_user_bookings(uuid) TO authenticated;
