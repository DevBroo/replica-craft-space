
-- Phase 1: DB updates for Booking Management

-- 1) Add missing columns (idempotent)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS refund_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS agent_id uuid;

-- 2) Add foreign keys (NOT VALID to avoid failing on existing data; can be validated later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_property_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_user_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_agent_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_agent_id_fkey
      FOREIGN KEY (agent_id) REFERENCES public.profiles(id) NOT VALID;
  END IF;
END$$;

-- 3) Performance indexes for common filters
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings (created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings (payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings (property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON public.bookings (agent_id);

-- 4) Ensure updated_at auto-updates on change
DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Admin list view for rich joins (properties + users + owners + agents)
CREATE OR REPLACE VIEW public.booking_admin_list AS
SELECT
  b.id,
  b.created_at,
  b.updated_at,
  b.property_id,
  p.title AS property_title,
  b.user_id,
  u.full_name AS user_name,
  p.owner_id,
  o.full_name AS owner_name,
  b.agent_id,
  a.full_name AS agent_name,
  b.check_in_date,
  b.check_out_date,
  b.guests,
  b.total_amount,
  b.status,
  b.payment_status,
  b.refund_status,
  b.refund_amount
FROM public.bookings b
LEFT JOIN public.properties p ON p.id = b.property_id
LEFT JOIN public.profiles  u ON u.id = b.user_id
LEFT JOIN public.profiles  o ON o.id = p.owner_id
LEFT JOIN public.profiles  a ON a.id = b.agent_id;

-- 6) Detailed analytics for admin (payments + refunds + cancellations)
CREATE OR REPLACE FUNCTION public.get_booking_analytics_detailed(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_bookings bigint,
  total_revenue numeric,
  average_booking_value numeric,
  bookings_by_status jsonb,
  payments_by_status jsonb,
  refunds jsonb,
  cancellations bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required for booking analytics';
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT * FROM public.bookings
    WHERE created_at::date BETWEEN start_date AND end_date
  ),
  status_counts AS (
    SELECT status, COUNT(*)::bigint AS cnt FROM scoped GROUP BY status
  ),
  payment_counts AS (
    SELECT payment_status, COUNT(*)::bigint AS cnt FROM scoped GROUP BY payment_status
  ),
  refund_aggs AS (
    SELECT 
      COALESCE(SUM(refund_amount), 0) AS total_refund_amount,
      json_object_agg(refund_status, cnt) FILTER (WHERE refund_status IS NOT NULL) AS by_status
    FROM (
      SELECT refund_status, COUNT(*)::bigint AS cnt
      FROM scoped
      WHERE refund_status IS NOT NULL
      GROUP BY refund_status
    ) rs
  )
  SELECT
    (SELECT COUNT(*) FROM scoped) AS total_bookings,
    COALESCE((SELECT SUM(total_amount) FROM scoped), 0) AS total_revenue,
    COALESCE((SELECT AVG(total_amount) FROM scoped), 0) AS average_booking_value,
    (SELECT json_object_agg(COALESCE(status,'unknown'), cnt) FROM status_counts)::jsonb AS bookings_by_status,
    (SELECT json_object_agg(COALESCE(payment_status,'unknown'), cnt) FROM payment_counts)::jsonb AS payments_by_status,
    json_build_object(
      'total_refund_amount', COALESCE((SELECT total_refund_amount FROM refund_aggs), 0),
      'by_status', COALESCE((SELECT by_status FROM refund_aggs), '{}'::json)
    )::jsonb AS refunds,
    (SELECT COUNT(*) FROM scoped WHERE status ILIKE 'cancel%')::bigint AS cancellations;
END;
$fn$;
