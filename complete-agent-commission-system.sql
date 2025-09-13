-- Complete Agent Commission System Setup
-- This script combines commission creation and update functionality
-- Run this entire script in Supabase SQL Editor

-- ==============================================
-- PART 1: CREATE COMMISSION RECORDS FOR EXISTING BOOKINGS
-- ==============================================

-- Create commission records for existing confirmed bookings with agent_id
INSERT INTO public.agent_commissions (
  agent_id,
  booking_id,
  commission_rate,
  booking_amount,
  commission_amount,
  status
)
SELECT 
  b.agent_id,
  b.id,
  COALESCE(acs.commission_rate, p.commission_rate, 0.10), -- Use 0.10 (0.1%) as default
  b.total_amount,
  (b.total_amount * COALESCE(acs.commission_rate, p.commission_rate, 0.10)) / 100,
  CASE 
    WHEN b.status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END
FROM public.bookings b
JOIN public.profiles p ON p.id = b.agent_id
LEFT JOIN public.agent_commission_settings acs ON acs.agent_id = b.agent_id 
  AND acs.is_active = true 
  AND (acs.effective_until IS NULL OR acs.effective_until > now())
WHERE b.agent_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_commissions ac 
    WHERE ac.booking_id = b.id
  );

-- ==============================================
-- PART 2: CREATE COMMISSION CREATION FUNCTION
-- ==============================================

-- Create function to create commission when booking is confirmed
CREATE OR REPLACE FUNCTION public.create_agent_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_commission_amount DECIMAL(10,2);
  v_commission_rate DECIMAL(5,2);
BEGIN
  -- Only create commission if booking is confirmed and has an agent
  IF NEW.status = 'confirmed' AND NEW.agent_id IS NOT NULL THEN
    -- Check if commission already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.agent_commissions 
      WHERE booking_id = NEW.id
    ) THEN
      -- Get commission rate
      SELECT commission_rate INTO v_commission_rate
      FROM public.agent_commission_settings
      WHERE agent_id = NEW.agent_id
        AND is_active = true
        AND (effective_until IS NULL OR effective_until > now())
      ORDER BY effective_from DESC
      LIMIT 1;
      
      IF v_commission_rate IS NULL THEN
        SELECT COALESCE(commission_rate, 0.10) INTO v_commission_rate
        FROM public.profiles
        WHERE id = NEW.agent_id;
      END IF;
      
      -- Calculate commission amount
      v_commission_amount := (NEW.total_amount * v_commission_rate) / 100;
      
      -- Insert commission record
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
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ==============================================
-- PART 3: CREATE COMMISSION UPDATE FUNCTION
-- ==============================================

-- Create function to update commission when booking is modified
CREATE OR REPLACE FUNCTION public.update_agent_commission_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_commission_rate DECIMAL(5,2);
  v_new_commission_amount DECIMAL(10,2);
BEGIN
  -- Only process if booking has an agent and is confirmed
  IF NEW.agent_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    
    -- Get commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM public.agent_commission_settings
    WHERE agent_id = NEW.agent_id
      AND is_active = true
      AND (effective_until IS NULL OR effective_until > now())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    IF v_commission_rate IS NULL THEN
      SELECT COALESCE(commission_rate, 0.10) INTO v_commission_rate
      FROM public.profiles
      WHERE id = NEW.agent_id;
    END IF;
    
    -- Calculate new commission amount
    v_new_commission_amount := (NEW.total_amount * v_commission_rate) / 100;
    
    -- Update existing commission record
    UPDATE public.agent_commissions
    SET 
      booking_amount = NEW.total_amount,
      commission_amount = v_new_commission_amount,
      updated_at = now()
    WHERE booking_id = NEW.id;
    
    -- If no commission record exists, create one
    IF NOT FOUND THEN
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
        v_new_commission_amount,
        'pending'
      );
    END IF;
    
  -- If booking is cancelled, update commission status
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.agent_commissions
    SET 
      status = 'cancelled',
      updated_at = now()
    WHERE booking_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ==============================================
-- PART 4: CREATE TRIGGERS
-- ==============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_create_agent_commission ON public.bookings;
DROP TRIGGER IF EXISTS trigger_update_agent_commission ON public.bookings;

-- Create trigger for commission creation (INSERT and UPDATE)
CREATE TRIGGER trigger_create_agent_commission
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND NEW.agent_id IS NOT NULL)
  EXECUTE FUNCTION public.create_agent_commission();

-- Create trigger for commission updates (modifications and cancellations)
CREATE TRIGGER trigger_update_agent_commission
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (
    (NEW.total_amount != OLD.total_amount) OR 
    (NEW.status != OLD.status) OR
    (NEW.agent_id IS NOT NULL AND OLD.agent_id IS NULL)
  )
  EXECUTE FUNCTION public.update_agent_commission_on_booking_change();

-- ==============================================
-- PART 5: VERIFICATION AND TESTING
-- ==============================================

-- Test the commission summary function
SELECT 'Testing commission summary function...' as status;
SELECT public.get_agent_commission_summary('67af3277-e025-4cca-a504-b4f2d723f7ca'::UUID);

-- Show all commission records for the agent
SELECT 'Showing all commission records...' as status;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  b.status as booking_status,
  b.check_in_date,
  b.check_out_date,
  b.guests,
  p.title as property_title
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.properties p ON p.id = b.property_id
WHERE ac.agent_id = '67af3277-e025-4cca-a504-b4f2d723f7ca'
ORDER BY ac.created_at DESC;

-- Show summary statistics
SELECT 'Commission Summary Statistics:' as status;
SELECT 
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_commission_amount,
  AVG(commission_rate) as average_commission_rate,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_commissions,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_commissions,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_commissions,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_commissions
FROM public.agent_commissions
WHERE agent_id = '67af3277-e025-4cca-a504-b4f2d723f7ca';

-- Final success message
SELECT '✅ Agent Commission System Setup Complete!' as status;
SELECT '✅ Commission records created for existing bookings' as status;
SELECT '✅ Triggers created for automatic commission management' as status;
SELECT '✅ System ready for agent booking modifications and cancellations' as status;
