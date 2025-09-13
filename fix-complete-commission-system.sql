-- Complete Commission System Fix
-- This script fixes all commission-related issues and ensures proper functionality

-- ==============================================
-- PART 1: ENSURE ALL TABLES EXIST
-- ==============================================

-- Create agent_commissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  booking_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, booking_id)
);

-- Create agent_commission_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agent_commission_payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_count INTEGER NOT NULL DEFAULT 0,
  payout_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure agent_id column exists in bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id);

-- ==============================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent_id ON public.agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_booking_id ON public.agent_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON public.agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_commission_settings_agent_id ON public.agent_commission_settings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commission_settings_active ON public.agent_commission_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON public.bookings(agent_id);

-- ==============================================
-- PART 3: ENABLE RLS AND CREATE POLICIES
-- ==============================================

ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commission_payouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view their own commissions" ON public.agent_commissions;
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.agent_commissions;
DROP POLICY IF EXISTS "System can insert commissions" ON public.agent_commissions;
DROP POLICY IF EXISTS "Agents can view their own settings" ON public.agent_commission_settings;
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.agent_commission_settings;
DROP POLICY IF EXISTS "Agents can view their own payouts" ON public.agent_commission_payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.agent_commission_payouts;

-- Create RLS policies for agent_commissions
CREATE POLICY "Agents can view their own commissions" ON public.agent_commissions FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Admins can view all commissions" ON public.agent_commissions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can insert commissions" ON public.agent_commissions FOR INSERT WITH CHECK (true);

-- Create RLS policies for agent_commission_settings
CREATE POLICY "Agents can view their own settings" ON public.agent_commission_settings FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Admins can manage all settings" ON public.agent_commission_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create RLS policies for agent_commission_payouts
CREATE POLICY "Agents can view their own payouts" ON public.agent_commission_payouts FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Admins can manage all payouts" ON public.agent_commission_payouts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================
-- PART 4: CREATE COMMISSION FUNCTIONS
-- ==============================================

-- Function to calculate commission for a booking
CREATE OR REPLACE FUNCTION public.calculate_agent_commission(
  p_agent_id UUID,
  p_booking_id UUID,
  p_booking_amount DECIMAL
) RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_commission_rate DECIMAL(5,2);
  v_commission_amount DECIMAL(10,2);
BEGIN
  -- Get the current commission rate for the agent
  SELECT commission_rate INTO v_commission_rate
  FROM public.agent_commission_settings
  WHERE agent_id = p_agent_id
    AND is_active = true
    AND (effective_until IS NULL OR effective_until > now())
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- If no specific rate found, use the default from profiles table
  IF v_commission_rate IS NULL THEN
    SELECT COALESCE(commission_rate, 0.10) INTO v_commission_rate
    FROM public.profiles
    WHERE id = p_agent_id;
  END IF;
  
  -- Calculate commission amount
  v_commission_amount := (p_booking_amount * v_commission_rate) / 100;
  RETURN v_commission_amount;
END;
$$;

-- Function to create commission record when booking is confirmed
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

-- Function to update commission when booking is modified
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

-- Function to get agent commission summary
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
SET search_path = ''
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
      (SELECT commission_rate FROM public.agent_commission_settings 
       WHERE agent_id = p_agent_id AND is_active = true 
       AND (effective_until IS NULL OR effective_until > now()) 
       ORDER BY effective_from DESC LIMIT 1),
      (SELECT COALESCE(commission_rate, 0.10) FROM public.profiles WHERE id = p_agent_id)
    ) as current_rate
  FROM public.agent_commissions ac
  WHERE ac.agent_id = p_agent_id;
END;
$$;

-- ==============================================
-- PART 5: CREATE TRIGGERS
-- ==============================================

-- Drop existing triggers
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
-- PART 6: CREATE COMMISSION RECORDS FOR EXISTING BOOKINGS
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

-- ==============================================
-- PART 7: CREATE DEFAULT COMMISSION SETTINGS FOR AGENTS
-- ==============================================

-- Insert default commission settings for existing agents
INSERT INTO public.agent_commission_settings (agent_id, commission_rate, is_active, effective_from)
SELECT 
  id, 
  COALESCE(commission_rate, 0.10), 
  true, 
  now()
FROM public.profiles 
WHERE role = 'agent' 
  AND id NOT IN (SELECT agent_id FROM public.agent_commission_settings WHERE is_active = true);

-- ==============================================
-- PART 8: CREATE UPDATED_AT TRIGGERS
-- ==============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_agent_commissions_updated_at ON public.agent_commissions;
DROP TRIGGER IF EXISTS update_agent_commission_settings_updated_at ON public.agent_commission_settings;
DROP TRIGGER IF EXISTS update_agent_commission_payouts_updated_at ON public.agent_commission_payouts;

CREATE TRIGGER update_agent_commissions_updated_at
  BEFORE UPDATE ON public.agent_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_commission_settings_updated_at
  BEFORE UPDATE ON public.agent_commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_commission_payouts_updated_at
  BEFORE UPDATE ON public.agent_commission_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- PART 9: GRANT PERMISSIONS
-- ==============================================

GRANT ALL ON public.agent_commissions TO authenticated;
GRANT ALL ON public.agent_commission_settings TO authenticated;
GRANT ALL ON public.agent_commission_payouts TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_agent_commission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_commission_summary TO authenticated;

-- ==============================================
-- PART 10: VERIFICATION AND TESTING
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

-- Show all agents and their commission settings
SELECT 'Agent Commission Settings:' as status;
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.commission_rate as profile_rate,
  acs.commission_rate as settings_rate,
  acs.is_active,
  acs.effective_from,
  acs.effective_until
FROM public.profiles p
LEFT JOIN public.agent_commission_settings acs ON acs.agent_id = p.id AND acs.is_active = true
WHERE p.role = 'agent'
ORDER BY p.created_at DESC;

-- Final success message
SELECT '✅ Complete Commission System Setup Complete!' as status;
SELECT '✅ All tables, functions, and triggers created' as status;
SELECT '✅ Commission records created for existing bookings' as status;
SELECT '✅ RLS policies configured' as status;
SELECT '✅ System ready for agent booking modifications and cancellations' as status;
SELECT '✅ Admin can now change commission rates for future bookings' as status;
