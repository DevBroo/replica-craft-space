-- Fix Commission Status and Set Default Rates
-- This script addresses the issues:
-- 1. Commissions should be auto-approved instead of pending
-- 2. Set default commission rates for all agents
-- 3. Update existing commissions to approved status

-- 1. Update the commission creation trigger to auto-approve commissions
CREATE OR REPLACE FUNCTION public.create_agent_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commission_amount DECIMAL(10,2);
  v_commission_rate DECIMAL(5,2);
BEGIN
  -- Only create commission if booking is confirmed and has an agent
  IF NEW.status = 'confirmed' AND NEW.agent_id IS NOT NULL THEN
    -- Calculate commission
    v_commission_amount := public.calculate_agent_commission(
      NEW.agent_id,
      NEW.id,
      NEW.total_amount
    );
    
    -- Get commission rate for record
    SELECT commission_rate INTO v_commission_rate
    FROM public.agent_commission_settings
    WHERE agent_id = NEW.agent_id
      AND is_active = true
      AND (effective_until IS NULL OR effective_until > now())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    IF v_commission_rate IS NULL THEN
      SELECT COALESCE(commission_rate, 5.00) INTO v_commission_rate
      FROM public.profiles
      WHERE id = NEW.agent_id;
    END IF;
    
    -- Insert commission record with 'approved' status instead of 'pending'
    INSERT INTO public.agent_commissions (
      agent_id,
      booking_id,
      commission_rate,
      booking_amount,
      commission_amount,
      status
    ) VALUES (
      NEW.agent_id,
      NEW.id,
      v_commission_rate,
      NEW.total_amount,
      v_commission_amount,
      'approved'  -- Changed from 'pending' to 'approved'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Set default commission rates for all agents (5% if not already set)
INSERT INTO public.agent_commission_settings (agent_id, commission_rate, is_active, effective_from)
SELECT 
  id,
  5.00,  -- Default 5% commission rate
  true,
  now()
FROM public.profiles
WHERE role = 'agent'
  AND id NOT IN (
    SELECT agent_id 
    FROM public.agent_commission_settings 
    WHERE is_active = true
  );

-- 3. Update existing pending commissions to approved status
UPDATE public.agent_commissions
SET status = 'approved', updated_at = now()
WHERE status = 'pending';

-- 4. Ensure all agents have commission rates in their profiles
UPDATE public.profiles
SET commission_rate = 5.00
WHERE role = 'agent' 
  AND (commission_rate IS NULL OR commission_rate = 0);

-- 5. Create a function to get agent commission summary with approved status
CREATE OR REPLACE FUNCTION public.get_agent_commission_summary(p_agent_id UUID)
RETURNS TABLE (
  total_commission DECIMAL(10,2),
  pending_commission DECIMAL(10,2),
  approved_commission DECIMAL(10,2),
  paid_commission DECIMAL(10,2),
  total_bookings INTEGER,
  current_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ac.commission_amount), 0) as total_commission,
    COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.commission_amount ELSE 0 END), 0) as pending_commission,
    COALESCE(SUM(CASE WHEN ac.status = 'approved' THEN ac.commission_amount ELSE 0 END), 0) as approved_commission,
    COALESCE(SUM(CASE WHEN ac.status = 'paid' THEN ac.commission_amount ELSE 0 END), 0) as paid_commission,
    COUNT(ac.id)::INTEGER as total_bookings,
    COALESCE(
      (SELECT commission_rate
       FROM public.agent_commission_settings
       WHERE agent_id = p_agent_id
         AND is_active = true
         AND (effective_until IS NULL OR effective_until > now())
       ORDER BY effective_from DESC
       LIMIT 1),
      (SELECT COALESCE(commission_rate, 5.00)
       FROM public.profiles
       WHERE id = p_agent_id)
    ) as current_rate;
END;
$$;

-- 6. Test the changes
SELECT 'Testing commission status changes...' as test;

-- Check current commission statuses
SELECT 
  status,
  COUNT(*) as count,
  SUM(commission_amount) as total_amount
FROM public.agent_commissions
GROUP BY status
ORDER BY status;

-- Check agent commission rates
SELECT 
  p.id,
  p.full_name,
  p.commission_rate as profile_rate,
  acs.commission_rate as settings_rate,
  acs.is_active
FROM public.profiles p
LEFT JOIN public.agent_commission_settings acs ON p.id = acs.agent_id AND acs.is_active = true
WHERE p.role = 'agent'
ORDER BY p.full_name;

-- Check recent commissions
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status,
  ac.created_at,
  p.full_name as agent_name
FROM public.agent_commissions ac
LEFT JOIN public.profiles p ON p.id = ac.agent_id
ORDER BY ac.created_at DESC
LIMIT 5;
