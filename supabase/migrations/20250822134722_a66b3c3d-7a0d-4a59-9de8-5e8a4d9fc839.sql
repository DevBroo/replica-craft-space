-- Fix security definer issues by setting proper search paths for existing functions
-- Update existing functions to have immutable search paths

DROP FUNCTION IF EXISTS public.get_property_contact_info(uuid);
CREATE OR REPLACE FUNCTION public.get_property_contact_info(property_id uuid)
RETURNS TABLE(contact_phone text, owner_email text, property_title text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow authenticated users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required to access contact information';
    END IF;
    
    -- Return contact info for approved properties only
    RETURN QUERY
    SELECT 
        p.contact_phone,
        pr.email as owner_email,
        p.title as property_title
    FROM public.properties p
    LEFT JOIN public.profiles pr ON pr.id = p.owner_id
    WHERE p.id = get_property_contact_info.property_id 
    AND p.status = 'approved';
END;
$$;

DROP FUNCTION IF EXISTS public.log_contact_access(uuid, uuid);
CREATE OR REPLACE FUNCTION public.log_contact_access(property_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- In production, you could log this to an audit table
    -- For now, we'll just validate the request
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.get_booking_analytics(date, date);
CREATE OR REPLACE FUNCTION public.get_booking_analytics(start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(total_bookings bigint, total_revenue numeric, average_booking_value numeric, bookings_by_status jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow admins to access booking analytics
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required for booking analytics';
    END IF;
    
    -- Return aggregated booking data (no personal details)
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(AVG(b.total_amount), 0) as average_booking_value,
        json_object_agg(
            COALESCE(b.status, 'unknown'), 
            status_count
        )::JSONB as bookings_by_status
    FROM public.bookings b
    LEFT JOIN (
        SELECT 
            status, 
            COUNT(*) as status_count
        FROM public.bookings 
        WHERE created_at::DATE BETWEEN start_date AND end_date
        GROUP BY status
    ) status_counts ON b.status = status_counts.status
    WHERE b.created_at::DATE BETWEEN start_date AND end_date;
END;
$$;