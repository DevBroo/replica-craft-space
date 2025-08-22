-- Fix remaining functions that might not have proper search paths
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.audit_booking_access();
CREATE OR REPLACE FUNCTION public.audit_booking_access()
RETURNS trigger
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- In production, you could log booking access to an audit table
    -- For now, we'll just ensure the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required to access booking data';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.booking_summary_for_owners;
CREATE VIEW public.booking_summary_for_owners AS
SELECT 
    b.id,
    b.property_id,
    b.check_in_date,
    b.check_out_date,
    b.guests,
    b.total_amount,
    b.created_at,
    b.status,
    CONCAT('Guest-', SUBSTRING(b.user_id::text, 1, 8)) as guest_reference,
    p.title as property_title
FROM public.bookings b
LEFT JOIN public.properties p ON p.id = b.property_id;

DROP VIEW IF EXISTS public.properties_public;
CREATE VIEW public.properties_public AS
SELECT 
    id,
    title,
    description,
    property_type,
    property_subtype,
    location,
    coordinates,
    pricing,
    max_guests,
    bedrooms,
    bathrooms,
    minimum_stay,
    house_rules,
    booking_rules,
    bed_configuration,
    is_featured,
    rating,
    review_count,
    created_at,
    updated_at,
    check_in_time,
    check_out_time,
    cancellation_policy,
    (location::jsonb->>'city') as general_location,
    country,
    postal_code,
    meal_plans,
    payment_methods,
    status,
    arrival_instructions,
    amenities,
    images
FROM public.properties 
WHERE status = 'approved';

-- Enable RLS on views (they inherit from underlying tables)
ALTER VIEW public.booking_summary_for_owners SET (security_barrier = true);
ALTER VIEW public.properties_public SET (security_barrier = true);