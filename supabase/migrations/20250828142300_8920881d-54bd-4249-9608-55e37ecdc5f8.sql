
-- 1) Add missing columns to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS menu_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS host_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS banquet_hall_capacity integer,
  ADD COLUMN IF NOT EXISTS ground_lawn_capacity integer;

-- Ensure properties.updated_at is maintained
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_properties'
  ) THEN
    CREATE TRIGGER set_timestamp_properties
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 2) Property status history
CREATE TABLE IF NOT EXISTS public.property_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  reason text,
  comment text,
  actor_id uuid,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_status_history ENABLE ROW LEVEL SECURITY;

-- Admins: full control
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_status_history' AND policyname='Admins can manage property_status_history'
  ) THEN
    CREATE POLICY "Admins can manage property_status_history"
      ON public.property_status_history
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END$$;

-- Owners: can read history for their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_status_history' AND policyname='Owners can view their property history'
  ) THEN
    CREATE POLICY "Owners can view their property history"
      ON public.property_status_history
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.properties p
          WHERE p.id = property_status_history.property_id
            AND p.owner_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_property_status_history_property_created
  ON public.property_status_history(property_id, created_at);

-- 3) Availability table
CREATE TABLE IF NOT EXISTS public.property_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  day date NOT NULL,
  category text NOT NULL, -- e.g. 'rooms', 'day_picnic', 'banquet_hall', 'ground_lawn'
  total_capacity integer NOT NULL DEFAULT 0,
  booked_units integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available', -- e.g. 'available', 'blocked'
  booking_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, category, day)
);

ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

-- Validation trigger (avoid CHECK constraints for time-based or mutable logic)
CREATE OR REPLACE FUNCTION public.validate_property_availability_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.total_capacity < 0 OR NEW.booked_units < 0 THEN
    RAISE EXCEPTION 'total_capacity and booked_units must be non-negative';
  END IF;
  IF NEW.booked_units > NEW.total_capacity THEN
    RAISE EXCEPTION 'booked_units cannot exceed total_capacity';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_property_availability_row_trg'
  ) THEN
    CREATE TRIGGER validate_property_availability_row_trg
    BEFORE INSERT OR UPDATE ON public.property_availability
    FOR EACH ROW EXECUTE FUNCTION public.validate_property_availability_row();
  END IF;
END$$;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_property_availability'
  ) THEN
    CREATE TRIGGER set_timestamp_property_availability
    BEFORE UPDATE ON public.property_availability
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- RLS: Admins manage all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_availability' AND policyname='Admins can manage property_availability'
  ) THEN
    CREATE POLICY "Admins can manage property_availability"
      ON public.property_availability
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END$$;

-- RLS: Owners can SELECT their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_availability' AND policyname='Owners can view their availability'
  ) THEN
    CREATE POLICY "Owners can view their availability"
      ON public.property_availability
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.properties p
          WHERE p.id = property_availability.property_id
            AND p.owner_id = auth.uid()
        )
      );
  END IF;
END$$;

-- RLS: Owners can INSERT/UPDATE/DELETE their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_availability' AND policyname='Owners can insert availability'
  ) THEN
    CREATE POLICY "Owners can insert availability"
      ON public.property_availability
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.properties p
          WHERE p.id = property_availability.property_id
            AND p.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_availability' AND policyname='Owners can update availability'
  ) THEN
    CREATE POLICY "Owners can update availability"
      ON public.property_availability
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.properties p
          WHERE p.id = property_availability.property_id
            AND p.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.properties p
          WHERE p.id = property_availability.property_id
            AND p.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='property_availability' AND policyname='Owners can delete availability'
  ) THEN
    CREATE POLICY "Owners can delete availability"
      ON public.property_availability
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.properties p
          WHERE p.id = property_availability.property_id
            AND p.owner_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_property_availability_property_cat_day
  ON public.property_availability(property_id, category, day);

-- 4) RPC: get_property_approval_stats (admin-only)
CREATE OR REPLACE FUNCTION public.get_property_approval_stats()
RETURNS TABLE (
  total_pending bigint,
  total_approved bigint,
  total_rejected bigint,
  avg_pending_hours numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  WITH counts AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') AS total_pending,
      COUNT(*) FILTER (WHERE status = 'approved') AS total_approved,
      COUNT(*) FILTER (WHERE status = 'rejected') AS total_rejected
    FROM public.properties
  ),
  avg_pending AS (
    SELECT AVG(EXTRACT(EPOCH FROM (now() - created_at)) / 3600.0) AS avg_hours
    FROM public.properties
    WHERE status = 'pending'
  )
  SELECT
    counts.total_pending::bigint,
    counts.total_approved::bigint,
    counts.total_rejected::bigint,
    COALESCE(avg_pending.avg_hours, 0)
  FROM counts, avg_pending;
END;
$$;

-- 4) RPC: log_property_status_change (admin-only)
CREATE OR REPLACE FUNCTION public.log_property_status_change(
  p_property_id uuid,
  p_to_status text,
  p_reason text DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_from_status text;
  v_owner uuid;
  v_title text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT status, owner_id, title
    INTO v_from_status, v_owner, v_title
  FROM public.properties
  WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  UPDATE public.properties
     SET status = p_to_status,
         updated_at = now()
   WHERE id = p_property_id;

  INSERT INTO public.property_status_history(
    property_id, from_status, to_status, reason, comment, actor_id, actor_role
  ) VALUES (
    p_property_id, v_from_status, p_to_status, p_reason, p_comment, auth.uid(), 'admin'
  );

  -- Optional: notify owner if present
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications(
      target_user_id, related_entity_id, title, content, related_entity_type
    ) VALUES (
      v_owner,
      p_property_id,
      'Property status updated',
      COALESCE(v_title, 'Your property') || ' status changed from ' ||
      COALESCE(v_from_status, 'unknown') || ' to ' || COALESCE(p_to_status, 'unknown') ||
      CASE WHEN p_comment IS NOT NULL THEN ' - ' || p_comment ELSE '' END,
      'property'
    );
  END IF;

  RETURN TRUE;
END;
$$;
