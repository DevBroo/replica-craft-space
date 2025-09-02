-- Update properties_public view to filter out admin_blocked properties
-- This ensures blocked properties are not visible to users on public pages

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
WHERE status = 'approved' 
  AND (admin_blocked IS NULL OR admin_blocked = false);

-- Grant permissions
GRANT SELECT ON public.properties_public TO anon;
GRANT SELECT ON public.properties_public TO authenticated;

-- Add comment
COMMENT ON VIEW public.properties_public IS 'Public view of approved and non-blocked properties with sensitive information masked. Accessible to anonymous users.';
