-- Agent Commission System Database Schema
-- This script creates the necessary tables and functions for agent commission tracking

-- 1. Create agent_commissions table to track individual commission records
CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage (e.g., 5.00 for 5%)
  booking_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, booking_id)
);

-- 2. Create agent_commission_settings table for admin to manage commission rates
CREATE TABLE IF NOT EXISTS public.agent_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- Default 5%
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create agent_commission_payouts table for tracking payments to agents
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

-- 4. Add agent_id to bookings table to track which agent made the booking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent_id ON public.agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_booking_id ON public.agent_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON public.agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_commission_settings_agent_id ON public.agent_commission_settings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commission_settings_active ON public.agent_commission_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON public.bookings(agent_id);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commission_payouts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for agent_commissions
CREATE POLICY "Agents can view their own commissions" ON public.agent_commissions
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all commissions" ON public.agent_commissions
  FOR ALL USING (public.is_admin());

CREATE POLICY "System can insert commissions" ON public.agent_commissions
  FOR INSERT WITH CHECK (true);

-- 8. Create RLS policies for agent_commission_settings
CREATE POLICY "Agents can view their own settings" ON public.agent_commission_settings
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can manage all settings" ON public.agent_commission_settings
  FOR ALL USING (public.is_admin());

-- 9. Create RLS policies for agent_commission_payouts
CREATE POLICY "Agents can view their own payouts" ON public.agent_commission_payouts
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can manage all payouts" ON public.agent_commission_payouts
  FOR ALL USING (public.is_admin());

-- 10. Create function to calculate commission for a booking
CREATE OR REPLACE FUNCTION public.calculate_agent_commission(
  p_agent_id UUID,
  p_booking_id UUID,
  p_booking_amount DECIMAL
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
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
    SELECT COALESCE(commission_rate, 5.00) INTO v_commission_rate
    FROM public.profiles
    WHERE id = p_agent_id;
  END IF;
  
  -- Calculate commission amount
  v_commission_amount := (p_booking_amount * v_commission_rate) / 100;
  
  RETURN v_commission_amount;
END;
$$;

-- 11. Create function to create commission record when booking is confirmed
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
  
  RETURN NEW;
END;
$$;

-- 12. Create trigger to automatically create commission when booking is confirmed
DROP TRIGGER IF EXISTS trigger_create_agent_commission ON public.bookings;
CREATE TRIGGER trigger_create_agent_commission
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.agent_id IS NOT NULL)
  EXECUTE FUNCTION public.create_agent_commission();

-- 13. Create function to get agent commission summary
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
      (SELECT COALESCE(commission_rate, 5.00) FROM public.profiles WHERE id = p_agent_id)
    ) as current_rate;
END;
$$;

-- 14. Create function to update commission status
CREATE OR REPLACE FUNCTION public.update_commission_status(
  p_commission_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.agent_commissions
  SET status = p_status,
      updated_at = now()
  WHERE id = p_commission_id;
  
  RETURN FOUND;
END;
$$;

-- 15. Insert default commission settings for existing agents
INSERT INTO public.agent_commission_settings (agent_id, commission_rate, is_active, effective_from)
SELECT 
  id,
  COALESCE(commission_rate, 5.00),
  true,
  now()
FROM public.profiles
WHERE role = 'agent'
  AND id NOT IN (SELECT agent_id FROM public.agent_commission_settings);

-- 16. Create view for agent dashboard data
CREATE OR REPLACE VIEW public.agent_dashboard_data AS
SELECT 
  p.id as agent_id,
  p.full_name,
  p.email,
  p.phone,
  p.avatar_url,
  p.is_active,
  COALESCE(acs.commission_rate, p.commission_rate, 5.00) as current_commission_rate,
  COALESCE(comm_stats.total_commission, 0) as total_commission,
  COALESCE(comm_stats.pending_commission, 0) as pending_commission,
  COALESCE(comm_stats.approved_commission, 0) as approved_commission,
  COALESCE(comm_stats.paid_commission, 0) as paid_commission,
  COALESCE(comm_stats.total_bookings, 0) as total_bookings,
  p.created_at as agent_since
FROM public.profiles p
LEFT JOIN public.agent_commission_settings acs ON p.id = acs.agent_id 
  AND acs.is_active = true 
  AND (acs.effective_until IS NULL OR acs.effective_until > now())
LEFT JOIN LATERAL (
  SELECT 
    SUM(commission_amount) as total_commission,
    SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commission,
    SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END) as approved_commission,
    SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commission,
    COUNT(*) as total_bookings
  FROM public.agent_commissions
  WHERE agent_id = p.id
) comm_stats ON true
WHERE p.role = 'agent';

-- 17. Grant necessary permissions
GRANT SELECT ON public.agent_dashboard_data TO authenticated;
GRANT ALL ON public.agent_commissions TO authenticated;
GRANT ALL ON public.agent_commission_settings TO authenticated;
GRANT ALL ON public.agent_commission_payouts TO authenticated;

-- 18. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 19. Add updated_at triggers
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

-- 20. Add comments for documentation
COMMENT ON TABLE public.agent_commissions IS 'Tracks individual commission records for agents on bookings';
COMMENT ON TABLE public.agent_commission_settings IS 'Manages commission rates and settings for agents';
COMMENT ON TABLE public.agent_commission_payouts IS 'Tracks commission payments made to agents';
COMMENT ON COLUMN public.bookings.agent_id IS 'References the agent who made this booking';
COMMENT ON FUNCTION public.calculate_agent_commission IS 'Calculates commission amount for an agent on a booking';
COMMENT ON FUNCTION public.get_agent_commission_summary IS 'Returns commission summary statistics for an agent';
COMMENT ON VIEW public.agent_dashboard_data IS 'Aggregated data for agent dashboard display';
