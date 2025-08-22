-- Fix Security Warnings from Properties Migration
-- This addresses the security linter issues identified

-- Step 1: Fix the properties_public view to not use SECURITY DEFINER
-- Drop the existing view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.properties_public;

-- Create regular view (not SECURITY DEFINER) for public property access
CREATE VIEW public.properties_public AS
SELECT 
    id,
    title,
    description,
    property_type,
    property_subtype,
    max_guests,
    bedrooms,
    bathrooms,
    amenities,
    images,
    pricing,
    location,
    coordinates,
    -- Mask exact address for privacy - only show city/area
    CASE 
        WHEN location IS NOT NULL THEN 
            split_part(address, ',', -2) || ', ' || split_part(address, ',', -1)
        ELSE 'Location Available'
    END as general_location,
    country,
    postal_code,
    is_featured,
    rating,
    review_count,
    minimum_stay,
    check_in_time,
    check_out_time,
    cancellation_policy,
    meal_plans,
    payment_methods,
    house_rules,
    booking_rules,
    bed_configuration,
    arrival_instructions,
    created_at,
    updated_at,
    status
FROM public.properties
WHERE status = 'approved';

-- Step 2: Fix all functions to have stable search_path
-- Update get_property_contact_info function
CREATE OR REPLACE FUNCTION public.get_property_contact_info(property_id UUID)
RETURNS TABLE(
    contact_phone TEXT,
    owner_email TEXT,
    property_title TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Update log_contact_access function  
CREATE OR REPLACE FUNCTION public.log_contact_access(
    property_id UUID,
    user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Step 3: Update existing functions to have stable search_path
-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Re-grant permissions on the updated view
GRANT SELECT ON public.properties_public TO anon;
GRANT SELECT ON public.properties_public TO authenticated;