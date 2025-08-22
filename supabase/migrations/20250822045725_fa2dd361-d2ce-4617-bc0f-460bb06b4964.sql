-- Security Fix: Protect Customer Booking Data from Unauthorized Access
-- This migration adds explicit policies to block anonymous access to sensitive booking information

-- Step 1: Drop existing policies to recreate them with explicit authentication requirements
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Property owners can view bookings for their properties" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Step 2: Create restrictive policies that explicitly require authentication

-- Users can only view their own bookings (authenticated users only)
CREATE POLICY "Authenticated users can view their own bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

-- Property owners can view bookings for their properties (authenticated property owners only)
CREATE POLICY "Property owners can view bookings for their properties" ON public.bookings
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT p.owner_id 
            FROM public.properties p 
            WHERE p.id = bookings.property_id
        )
    );

-- Only authenticated users can create bookings for themselves
CREATE POLICY "Authenticated users can create their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

-- Only authenticated users can update their own bookings
CREATE POLICY "Authenticated users can update their own bookings" ON public.bookings
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

-- Property owners can update booking status for their properties (e.g., confirm/reject)
CREATE POLICY "Property owners can update booking status" ON public.bookings
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT p.owner_id 
            FROM public.properties p 
            WHERE p.id = bookings.property_id
        )
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT p.owner_id 
            FROM public.properties p 
            WHERE p.id = bookings.property_id
        )
    );

-- Step 3: Add admin access for booking management
CREATE POLICY "Admins can manage all bookings" ON public.bookings
    FOR ALL USING (
        auth.uid() IS NOT NULL AND 
        public.is_admin()
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND 
        public.is_admin()
    );

-- Step 4: Explicitly block anonymous access with a restrictive policy
-- This ensures no anonymous users can access booking data under any circumstances
CREATE POLICY "Block anonymous access to bookings" ON public.bookings
    FOR ALL TO anon USING (false) WITH CHECK (false);

-- Step 5: Create a secure function for booking analytics (admin only)
CREATE OR REPLACE FUNCTION public.get_booking_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_bookings BIGINT,
    total_revenue NUMERIC,
    average_booking_value NUMERIC,
    bookings_by_status JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_booking_analytics(DATE, DATE) TO authenticated;

-- Step 7: Create audit trigger for booking access (optional but recommended)
CREATE OR REPLACE FUNCTION public.audit_booking_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Note: Uncomment the following lines if you want to enable booking access auditing
-- CREATE TRIGGER audit_booking_access_trigger
--     BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.bookings
--     FOR EACH ROW
--     EXECUTE FUNCTION public.audit_booking_access();

-- Step 8: Create a secure booking summary view for property owners
CREATE OR REPLACE VIEW public.booking_summary_for_owners AS
SELECT 
    b.id,
    b.property_id,
    b.check_in_date,
    b.check_out_date,
    b.guests,
    b.total_amount,
    b.status,
    b.created_at,
    -- Mask sensitive user details
    'Customer #' || substring(b.user_id::text, 1, 8) as guest_reference,
    p.title as property_title
FROM public.bookings b
JOIN public.properties p ON p.id = b.property_id
WHERE 
    -- Only show bookings for properties owned by the current user
    p.owner_id = auth.uid() AND
    -- Only authenticated users can access this view
    auth.uid() IS NOT NULL;

-- Grant access to the owner summary view
GRANT SELECT ON public.booking_summary_for_owners TO authenticated;