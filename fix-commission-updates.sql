-- Fix commission updates when bookings are modified or cancelled
-- This will automatically update commission records when booking amounts change

-- 1. Create function to update commission when booking is modified
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

-- 2. Create trigger for booking updates
DROP TRIGGER IF EXISTS trigger_update_agent_commission ON public.bookings;
CREATE TRIGGER trigger_update_agent_commission
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (
    (NEW.total_amount != OLD.total_amount) OR 
    (NEW.status != OLD.status) OR
    (NEW.agent_id IS NOT NULL AND OLD.agent_id IS NULL)
  )
  EXECUTE FUNCTION public.update_agent_commission_on_booking_change();

-- 3. Create commission records for existing bookings that don't have them
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
  COALESCE(acs.commission_rate, p.commission_rate, 0.10),
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

-- 4. Test the function
SELECT 'Commission update triggers created successfully' as status;

-- 5. Show updated commission records
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
  b.check_out_date
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
WHERE ac.agent_id = '67af3277-e025-4cca-a504-b4f2d723f7ca'
ORDER BY ac.created_at DESC;
