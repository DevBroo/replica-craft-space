-- Fix security vulnerability by dropping the insecure view and replacing it with a secure function

-- Drop the existing insecure view
DROP VIEW IF EXISTS public.booking_summary_for_owners;

-- Create a security definer function that only returns booking summaries 
-- for properties owned by the current user (or all if admin)
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
      WHEN is_admin() OR EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = b.property_id AND p.owner_id = auth.uid()
      ) THEN CONCAT('GUEST-', SUBSTRING(b.user_id::text, 1, 8))
      ELSE NULL
    END as guest_reference,
    p.title as property_title
  FROM bookings b
  JOIN properties p ON p.id = b.property_id
  WHERE 
    -- Admin can see all bookings
    is_admin() 
    OR 
    -- Property owners can only see bookings for their properties
    (auth.uid() IS NOT NULL AND p.owner_id = auth.uid())
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.get_booking_summary_for_owners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_summary_for_owners() TO authenticated;