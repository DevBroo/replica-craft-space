-- Fix security vulnerability in booking_summary_for_owners table
-- Enable RLS and create proper access policies

-- Enable Row Level Security on the table
ALTER TABLE public.booking_summary_for_owners ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can view all booking summaries
CREATE POLICY "Admins can view all booking summaries"
ON public.booking_summary_for_owners
FOR SELECT
USING (is_admin());

-- Policy 2: Property owners can only view summaries for their own properties
CREATE POLICY "Property owners can view their property bookings"
ON public.booking_summary_for_owners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM properties p 
    WHERE p.id = booking_summary_for_owners.property_id 
    AND p.owner_id = auth.uid()
  )
);

-- Policy 3: Block all other access (including anonymous users)
CREATE POLICY "Block unauthorized access to booking summaries"
ON public.booking_summary_for_owners
FOR ALL
USING (false);

-- Note: The booking_summary_for_owners appears to be a view or summary table
-- If this is a view, we should also secure the underlying bookings table
-- Ensure the underlying bookings table has proper RLS as well