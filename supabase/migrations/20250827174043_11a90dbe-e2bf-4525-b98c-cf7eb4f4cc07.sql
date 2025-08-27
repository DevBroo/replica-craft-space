-- Fix properties_public view to use security_invoker = true
-- This ensures proper RLS enforcement

DROP VIEW IF EXISTS public.properties_public;

CREATE VIEW public.properties_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  property_type,
  property_subtype,
  max_guests,
  bedrooms,
  bathrooms,
  pricing,
  location,
  coordinates,
  is_featured,
  rating,
  review_count,
  minimum_stay,
  house_rules,
  booking_rules,
  bed_configuration,
  created_at,
  updated_at,
  images,
  amenities,
  check_in_time,
  check_out_time,
  cancellation_policy,
  (location->>'city') as general_location,
  country,
  postal_code,
  meal_plans,
  payment_methods,
  status,
  arrival_instructions
FROM public.properties
WHERE status = 'approved';

-- Also fix booking summary view
DROP VIEW IF EXISTS public.booking_summary_for_owners;

-- Remove the function since we're replacing it with a proper view
DROP FUNCTION IF EXISTS public.get_booking_summary_for_owners();

CREATE VIEW public.booking_summary_for_owners 
WITH (security_invoker = true) AS
SELECT 
  b.property_id,
  b.check_in_date,
  b.check_out_date,
  b.guests,
  b.total_amount,
  b.id,
  b.created_at,
  b.status,
  CASE 
    -- Only show guest reference to property owners and admins
    WHEN public.is_admin() OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = b.property_id AND p.owner_id = auth.uid()
    ) THEN CONCAT('GUEST-', SUBSTRING(b.user_id::text, 1, 8))
    ELSE NULL
  END as guest_reference,
  p.title as property_title
FROM public.bookings b
JOIN public.properties p ON p.id = b.property_id
WHERE 
  -- Admin can see all bookings
  public.is_admin() 
  OR 
  -- Property owners can only see bookings for their properties
  (auth.uid() IS NOT NULL AND p.owner_id = auth.uid());