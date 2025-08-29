-- Enhanced security for owner_bank_details table
-- Add audit logging table for sensitive data access
CREATE TABLE IF NOT EXISTS public.bank_details_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  accessed_by UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'update', 'create')),
  ip_address TEXT,
  user_agent TEXT,
  accessed_fields TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.bank_details_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs" ON public.bank_details_audit_log
  FOR SELECT USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.bank_details_audit_log
  FOR INSERT WITH CHECK (true);

-- Create function to log bank details access
CREATE OR REPLACE FUNCTION public.log_bank_details_access(
  p_owner_id UUID,
  p_access_type TEXT,
  p_accessed_fields TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.bank_details_audit_log (
    owner_id,
    accessed_by,
    access_type,
    accessed_fields
  ) VALUES (
    p_owner_id,
    auth.uid(),
    p_access_type,
    p_accessed_fields
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_bank_details_access(UUID, TEXT, TEXT[]) TO authenticated;

-- Create function to safely retrieve bank details with logging
CREATE OR REPLACE FUNCTION public.get_bank_details_safe(p_owner_id UUID)
RETURNS TABLE(
  id UUID,
  account_holder_name TEXT,
  bank_name TEXT,
  branch_name TEXT,
  account_number_masked TEXT,
  ifsc_code TEXT,
  account_type TEXT,
  pan_number_masked TEXT,
  upi_id_masked TEXT,
  micr_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_owner BOOLEAN := FALSE;
  is_admin_user BOOLEAN := FALSE;
BEGIN
  -- Check if current user is the owner
  is_owner := (auth.uid() = p_owner_id);
  
  -- Check if current user is admin
  is_admin_user := is_admin();
  
  -- Only allow access to owner or admin
  IF NOT (is_owner OR is_admin_user) THEN
    RAISE EXCEPTION 'Unauthorized access to bank details';
  END IF;
  
  -- Log the access
  PERFORM log_bank_details_access(
    p_owner_id, 
    'view', 
    ARRAY['account_number', 'pan_number', 'upi_id']
  );
  
  -- Return masked data for security
  RETURN QUERY
  SELECT 
    bd.id,
    bd.account_holder_name,
    bd.bank_name,
    bd.branch_name,
    CASE 
      WHEN is_admin_user THEN bd.account_number
      ELSE 'XXXX' || RIGHT(bd.account_number, 4)
    END as account_number_masked,
    bd.ifsc_code,
    bd.account_type,
    CASE 
      WHEN is_admin_user THEN bd.pan_number
      WHEN bd.pan_number IS NOT NULL THEN LEFT(bd.pan_number, 3) || 'XXXX' || RIGHT(bd.pan_number, 1)
      ELSE NULL
    END as pan_number_masked,
    CASE 
      WHEN is_admin_user THEN bd.upi_id
      WHEN bd.upi_id IS NOT NULL THEN LEFT(bd.upi_id, 3) || 'XXXX@' || SPLIT_PART(bd.upi_id, '@', 2)
      ELSE NULL
    END as upi_id_masked,
    bd.micr_code
  FROM public.owner_bank_details bd
  WHERE bd.owner_id = p_owner_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_bank_details_safe(UUID) TO authenticated;

-- Add constraints for sensitive data validation
ALTER TABLE public.owner_bank_details 
  ADD CONSTRAINT valid_account_number_length 
  CHECK (length(account_number) >= 9 AND length(account_number) <= 18);

ALTER TABLE public.owner_bank_details 
  ADD CONSTRAINT valid_ifsc_format 
  CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$');

ALTER TABLE public.owner_bank_details 
  ADD CONSTRAINT valid_pan_format 
  CHECK (pan_number IS NULL OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');