-- Fix the security definer function to address search path warnings
CREATE OR REPLACE FUNCTION public.get_booking_summary_for_owners()
RETURNS TABLE (
  property_id uuid,
  check_in_date date,
  check_out_date date,
  guests integer,
  total_amount numeric,
  id uuid,
  created_at timestamptz,
  status text,
  guest_reference text,
  property_title text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
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
    (auth.uid() IS NOT NULL AND p.owner_id = auth.uid())
$$;