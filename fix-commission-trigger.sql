-- Fix commission creation for agent bookings
-- This will create commission records for existing bookings and fix the trigger

-- 1. Create commission records for existing confirmed bookings with agent_id
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
  'pending'
FROM public.bookings b
JOIN public.profiles p ON p.id = b.agent_id
LEFT JOIN public.agent_commission_settings acs ON acs.agent_id = b.agent_id 
  AND acs.is_active = true 
  AND (acs.effective_until IS NULL OR acs.effective_until > now())
WHERE b.agent_id IS NOT NULL 
  AND b.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_commissions ac 
    WHERE ac.booking_id = b.id
  );

-- 2. Update the trigger to also fire on INSERT (not just UPDATE)
DROP TRIGGER IF EXISTS trigger_create_agent_commission ON public.bookings;

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

-- 3. Create trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_create_agent_commission
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND NEW.agent_id IS NOT NULL)
  EXECUTE FUNCTION public.create_agent_commission();

-- 4. Test the function with your agent ID
SELECT public.get_agent_commission_summary('67af3277-e025-4cca-a504-b4f2d723f7ca'::UUID);

-- 5. Show created commission records
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  b.check_in_date,
  b.check_out_date
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
WHERE ac.agent_id = '67af3277-e025-4cca-a504-b4f2d723f7ca'
ORDER BY ac.created_at DESC;
