-- Phase 1: Database Updates for Enhanced Booking Management

-- Add missing columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_mode text,
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS modification_reason text,
ADD COLUMN IF NOT EXISTS last_modified_by uuid,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS refund_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS refund_processed_at timestamp with time zone;

-- Create booking_action_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.booking_action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on booking_action_logs
ALTER TABLE public.booking_action_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_action_logs
CREATE POLICY "Admins can manage booking action logs" 
ON public.booking_action_logs 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "System can insert booking action logs" 
ON public.booking_action_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to log booking actions
CREATE OR REPLACE FUNCTION public.log_booking_action(
  p_booking_id uuid,
  p_action text,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.booking_action_logs (
    booking_id,
    actor_id,
    action,
    reason,
    metadata
  ) VALUES (
    p_booking_id,
    auth.uid(),
    p_action,
    p_reason,
    p_metadata
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create trigger to log booking status changes
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_booking_action(
      NEW.id,
      'status_change',
      NEW.modification_reason,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_by', NEW.last_modified_by
      )
    );
  END IF;
  
  -- Log cancellations
  IF NEW.status LIKE 'cancel%' AND NEW.cancelled_at IS NULL THEN
    NEW.cancelled_at = now();
  END IF;
  
  -- Log refund status changes
  IF OLD.refund_status IS DISTINCT FROM NEW.refund_status THEN
    IF NEW.refund_status = 'requested' AND NEW.refund_requested_at IS NULL THEN
      NEW.refund_requested_at = now();
    ELSIF NEW.refund_status = 'processed' AND NEW.refund_processed_at IS NULL THEN
      NEW.refund_processed_at = now();
    END IF;
    
    PERFORM log_booking_action(
      NEW.id,
      'refund_status_change',
      NULL,
      jsonb_build_object(
        'old_refund_status', OLD.refund_status,
        'new_refund_status', NEW.refund_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for booking changes
DROP TRIGGER IF EXISTS booking_status_change_trigger ON public.bookings;
CREATE TRIGGER booking_status_change_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_status_change();

-- Update booking_admin_list view to include new fields
DROP VIEW IF EXISTS public.booking_admin_list;
CREATE VIEW public.booking_admin_list AS
SELECT 
  b.id,
  b.created_at,
  b.updated_at,
  b.property_id,
  b.user_id,
  p.owner_id,
  b.agent_id,
  b.check_in_date,
  b.check_out_date,
  b.guests,
  b.total_amount,
  b.refund_amount,
  b.status,
  b.payment_status,
  b.refund_status,
  b.payment_mode,
  b.transaction_id,
  b.cancellation_reason,
  b.modification_reason,
  b.last_modified_by,
  b.cancelled_at,
  b.refund_requested_at,
  b.refund_processed_at,
  p.title as property_title,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone,
  op.full_name as owner_name,
  ap.full_name as agent_name,
  lm.full_name as last_modified_by_name
FROM public.bookings b
LEFT JOIN public.properties p ON p.id = b.property_id
LEFT JOIN public.profiles up ON up.id = b.user_id
LEFT JOIN public.profiles op ON op.id = p.owner_id
LEFT JOIN public.profiles ap ON ap.id = b.agent_id
LEFT JOIN public.profiles lm ON lm.id = b.last_modified_by;

-- Enhanced booking analytics function
CREATE OR REPLACE FUNCTION public.get_booking_analytics_enhanced(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE,
  property_filter uuid DEFAULT NULL,
  owner_filter uuid DEFAULT NULL,
  agent_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  total_bookings bigint,
  total_revenue numeric,
  total_refunds numeric,
  average_booking_value numeric,
  bookings_by_status jsonb,
  payments_by_status jsonb,
  refunds_by_status jsonb,
  cancellation_rate numeric,
  top_properties jsonb,
  top_owners jsonb,
  revenue_trend jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required for enhanced booking analytics';
  END IF;

  RETURN QUERY
  WITH filtered_bookings AS (
    SELECT b.*, p.owner_id, p.title as property_title, o.full_name as owner_name
    FROM public.bookings b
    LEFT JOIN public.properties p ON p.id = b.property_id
    LEFT JOIN public.profiles o ON o.id = p.owner_id
    WHERE b.created_at::date BETWEEN start_date AND end_date
      AND (property_filter IS NULL OR b.property_id = property_filter)
      AND (owner_filter IS NULL OR p.owner_id = owner_filter)
      AND (agent_filter IS NULL OR b.agent_id = agent_filter)
  ),
  status_counts AS (
    SELECT status, COUNT(*) as cnt FROM filtered_bookings GROUP BY status
  ),
  payment_counts AS (
    SELECT payment_status, COUNT(*) as cnt FROM filtered_bookings GROUP BY payment_status
  ),
  refund_counts AS (
    SELECT refund_status, COUNT(*) as cnt FROM filtered_bookings GROUP BY refund_status
  ),
  top_props AS (
    SELECT property_id, property_title, COUNT(*) as booking_count, SUM(total_amount) as revenue
    FROM filtered_bookings 
    GROUP BY property_id, property_title 
    ORDER BY booking_count DESC, revenue DESC 
    LIMIT 5
  ),
  top_owners_data AS (
    SELECT owner_id, owner_name, COUNT(*) as booking_count, SUM(total_amount) as revenue
    FROM filtered_bookings 
    WHERE owner_id IS NOT NULL
    GROUP BY owner_id, owner_name 
    ORDER BY booking_count DESC, revenue DESC 
    LIMIT 5
  ),
  daily_revenue AS (
    SELECT 
      created_at::date as day,
      SUM(total_amount) as daily_revenue,
      COUNT(*) as daily_bookings
    FROM filtered_bookings
    GROUP BY created_at::date
    ORDER BY day
  )
  SELECT
    (SELECT COUNT(*) FROM filtered_bookings)::bigint,
    COALESCE((SELECT SUM(total_amount) FROM filtered_bookings), 0),
    COALESCE((SELECT SUM(refund_amount) FROM filtered_bookings), 0),
    COALESCE((SELECT AVG(total_amount) FROM filtered_bookings), 0),
    (SELECT json_object_agg(COALESCE(status,'unknown'), cnt) FROM status_counts)::jsonb,
    (SELECT json_object_agg(COALESCE(payment_status,'unknown'), cnt) FROM payment_counts)::jsonb,
    (SELECT json_object_agg(COALESCE(refund_status,'unknown'), cnt) FROM refund_counts)::jsonb,
    CASE 
      WHEN (SELECT COUNT(*) FROM filtered_bookings) > 0 
      THEN (SELECT COUNT(*) FROM filtered_bookings WHERE status LIKE 'cancel%')::numeric * 100.0 / (SELECT COUNT(*) FROM filtered_bookings)::numeric
      ELSE 0
    END,
    (SELECT json_agg(json_build_object('property_id', property_id, 'title', property_title, 'bookings', booking_count, 'revenue', revenue)) FROM top_props)::jsonb,
    (SELECT json_agg(json_build_object('owner_id', owner_id, 'name', owner_name, 'bookings', booking_count, 'revenue', revenue)) FROM top_owners_data)::jsonb,
    (SELECT json_agg(json_build_object('date', day, 'revenue', daily_revenue, 'bookings', daily_bookings)) FROM daily_revenue)::jsonb;
END;
$$;