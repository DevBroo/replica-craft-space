-- Fix Agent Dashboard Database Issues (SAFE VERSION)
-- This version handles the is_admin() function dependency issue

-- 1. Create agent_commissions table if it doesn't exist
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

-- 2. Create agent_commission_settings table if it doesn't exist
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

-- 3. Add agent_id to bookings table if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id);

-- 4. Enable RLS
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commission_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for agent_commissions
DROP POLICY IF EXISTS "Agents can view their own commissions" ON public.agent_commissions;
CREATE POLICY "Agents can view their own commissions" ON public.agent_commissions
  FOR SELECT USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all commissions" ON public.agent_commissions;
CREATE POLICY "Admins can view all commissions" ON public.agent_commissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert commissions" ON public.agent_commissions;
CREATE POLICY "System can insert commissions" ON public.agent_commissions
  FOR INSERT WITH CHECK (true);

-- 6. Create RLS policies for agent_commission_settings
DROP POLICY IF EXISTS "Agents can view their own settings" ON public.agent_commission_settings;
CREATE POLICY "Agents can view their own settings" ON public.agent_commission_settings
  FOR SELECT USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all settings" ON public.agent_commission_settings;
CREATE POLICY "Admins can manage all settings" ON public.agent_commission_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 7. Create the get_agent_commission_summary function (FIXED VERSION)
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
      (SELECT commission_rate 
       FROM public.agent_commission_settings 
       WHERE agent_id = p_agent_id 
         AND is_active = true 
         AND (effective_until IS NULL OR effective_until > now())
       ORDER BY effective_from DESC 
       LIMIT 1),
      (SELECT COALESCE(commission_rate, 5.00) FROM public.profiles WHERE id = p_agent_id)
    ) as current_rate
  FROM public.agent_commissions ac
  WHERE ac.agent_id = p_agent_id;
END;
$$;

-- 8. Grant permissions
GRANT ALL ON public.agent_commissions TO authenticated;
GRANT ALL ON public.agent_commission_settings TO authenticated;

-- 9. Insert default commission settings for existing agents
INSERT INTO public.agent_commission_settings (agent_id, commission_rate, is_active, effective_from)
SELECT 
  id,
  COALESCE(commission_rate, 5.00),
  true,
  now()
FROM public.profiles
WHERE role = 'agent'
  AND id NOT IN (SELECT agent_id FROM public.agent_commission_settings);

-- 10. Test the function
SELECT public.get_agent_commission_summary('67af3277-e025-4cca-a504-b4f2d723f7ca'::UUID);
