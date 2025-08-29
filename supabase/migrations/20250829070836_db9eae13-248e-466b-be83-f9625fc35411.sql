-- Enhanced security for profiles table personal information
-- Add audit logging table for personal data access
CREATE TABLE IF NOT EXISTS public.profiles_access_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  accessed_by UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'update', 'admin_view')),
  accessed_fields TEXT[],
  access_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.profiles_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access logs" ON public.profiles_access_audit
  FOR SELECT USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert profile access logs" ON public.profiles_access_audit
  FOR INSERT WITH CHECK (true);

-- Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_profile_id UUID,
  p_access_type TEXT,
  p_accessed_fields TEXT[] DEFAULT NULL,
  p_access_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles_access_audit (
    profile_id,
    accessed_by,
    access_type,
    accessed_fields,
    access_reason
  ) VALUES (
    p_profile_id,
    auth.uid(),
    p_access_type,
    p_accessed_fields,
    p_access_reason
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_profile_access(UUID, TEXT, TEXT[], TEXT) TO authenticated;

-- Create secure function to get profile with audit logging and data masking
CREATE OR REPLACE FUNCTION public.get_profile_secure(
  p_profile_id UUID,
  p_access_reason TEXT DEFAULT 'General access'
)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email_masked TEXT,
  phone_masked TEXT,
  role TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner BOOLEAN := FALSE;
  is_admin_user BOOLEAN := FALSE;
  profile_data RECORD;
BEGIN
  -- Check if current user is the profile owner
  is_owner := (auth.uid() = p_profile_id);
  
  -- Check if current user is admin
  is_admin_user := is_admin();
  
  -- Only allow access to profile owner or admin
  IF NOT (is_owner OR is_admin_user) THEN
    RAISE EXCEPTION 'Unauthorized access to profile information';
  END IF;
  
  -- Get the profile data
  SELECT p.* INTO profile_data
  FROM public.profiles p
  WHERE p.id = p_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Log the access
  PERFORM log_profile_access(
    p_profile_id, 
    CASE 
      WHEN is_admin_user THEN 'admin_view'
      ELSE 'view'
    END, 
    ARRAY['email', 'phone'],
    p_access_reason
  );
  
  -- Return data with appropriate masking
  RETURN QUERY
  SELECT 
    profile_data.id,
    profile_data.full_name,
    CASE 
      WHEN is_owner OR is_admin_user THEN profile_data.email
      ELSE LEFT(profile_data.email, 3) || '***@' || SPLIT_PART(profile_data.email, '@', 2)
    END as email_masked,
    CASE 
      WHEN is_owner OR is_admin_user THEN profile_data.phone
      WHEN profile_data.phone IS NOT NULL THEN 'XXX-XXX-' || RIGHT(profile_data.phone, 4)
      ELSE NULL
    END as phone_masked,
    profile_data.role,
    profile_data.avatar_url,
    profile_data.is_active,
    profile_data.created_at;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_profile_secure(UUID, TEXT) TO authenticated;

-- Create function to get profiles list for admins with audit logging
CREATE OR REPLACE FUNCTION public.get_profiles_admin_list(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
  p_access_reason TEXT DEFAULT 'Admin management'
)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email_partial TEXT,
  phone_partial TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_profiles BIGINT;
BEGIN
  -- Only allow admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required for profiles list';
  END IF;
  
  -- Get total count for pagination
  SELECT COUNT(*) INTO total_profiles
  FROM public.profiles p
  WHERE (p_search IS NULL OR 
         p.full_name ILIKE '%' || p_search || '%' OR 
         p.email ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR p.role = p_role_filter);
  
  -- Log bulk access
  PERFORM log_profile_access(
    auth.uid(), -- Use admin's own ID for bulk operations
    'admin_view',
    ARRAY['email', 'phone', 'bulk_access'],
    p_access_reason || ' - Bulk profiles access'
  );
  
  -- Return limited profile data with partial masking even for admins
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    -- Partial email masking even for admins to reduce exposure
    LEFT(p.email, 3) || '***@' || SPLIT_PART(p.email, '@', 2) as email_partial,
    -- Partial phone masking
    CASE 
      WHEN p.phone IS NOT NULL THEN 'XXX-XXX-' || RIGHT(p.phone, 4)
      ELSE NULL
    END as phone_partial,
    p.role,
    p.is_active,
    p.created_at,
    total_profiles
  FROM public.profiles p
  WHERE (p_search IS NULL OR 
         p.full_name ILIKE '%' || p_search || '%' OR 
         p.email ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR p.role = p_role_filter)
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_profiles_admin_list(INTEGER, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- Create function to get full profile details for legitimate admin operations
CREATE OR REPLACE FUNCTION public.get_profile_admin_full(
  p_profile_id UUID,
  p_access_reason TEXT
)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  commission_rate NUMERIC,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins and require access reason
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required for full profile details';
  END IF;
  
  IF p_access_reason IS NULL OR LENGTH(TRIM(p_access_reason)) < 10 THEN
    RAISE EXCEPTION 'Valid access reason (minimum 10 characters) required for full profile access';
  END IF;
  
  -- Log the full access with reason
  PERFORM log_profile_access(
    p_profile_id,
    'admin_view',
    ARRAY['email', 'phone', 'full_access'],
    'FULL ACCESS: ' || p_access_reason
  );
  
  -- Return full profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.role,
    p.avatar_url,
    p.is_active,
    p.created_at,
    p.updated_at,
    p.commission_rate,
    p.created_by
  FROM public.profiles p
  WHERE p.id = p_profile_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_profile_admin_full(UUID, TEXT) TO authenticated;