-- Fix booking creation issue by making the agent activity trigger more robust
-- This will prevent the trigger from failing when agent_activity_logs table doesn't exist

-- 1. Create agent_activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS on agent_activity_logs
ALTER TABLE public.agent_activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for agent_activity_logs
DROP POLICY IF EXISTS "Agents can view their own activity logs" ON public.agent_activity_logs;
CREATE POLICY "Agents can view their own activity logs" ON public.agent_activity_logs
  FOR SELECT USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.agent_activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.agent_activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON public.agent_activity_logs;
CREATE POLICY "System can insert activity logs" ON public.agent_activity_logs
  FOR INSERT WITH CHECK (true);

-- 4. Update the logging function to be more robust
CREATE OR REPLACE FUNCTION public.log_agent_activity_fn(
  p_agent_id uuid,
  p_action text,
  p_actor_id uuid,
  p_actor_type text,
  p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if agent_id is not null
  IF p_agent_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.agent_activity_logs(agent_id, action, actor_id, actor_type, metadata)
      VALUES (p_agent_id, p_action, p_actor_id, p_actor_type, COALESCE(p_metadata, '{}'::jsonb));
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the booking creation
        RAISE WARNING 'Failed to log agent activity: %', SQLERRM;
    END;
  END IF;
END;
$$;

-- 5. Update the booking trigger to be more robust
CREATE OR REPLACE FUNCTION public.on_booking_insert_log_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if agent_id is not null
  IF NEW.agent_id IS NOT NULL THEN
    BEGIN
      PERFORM public.log_agent_activity_fn(
        NEW.agent_id,
        'booking_created',
        COALESCE(NEW.agent_id, NEW.user_id),
        CASE WHEN NEW.agent_id IS NOT NULL THEN 'agent' ELSE 'user' END,
        jsonb_build_object(
          'booking_id', NEW.id, 
          'property_id', NEW.property_id, 
          'status', NEW.status, 
          'total_amount', NEW.total_amount
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the booking creation
        RAISE WARNING 'Failed to log agent activity for booking %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Test the function
SELECT 'Agent activity logging function updated successfully' as status;
