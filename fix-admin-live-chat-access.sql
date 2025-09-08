-- URGENT FIX: Support Tickets and Live Chat Admin Access
-- This script fixes the relationship errors and admin access issues

-- First, fix the missing foreign key relationships
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS fk_support_tickets_created_by;

ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS fk_support_tickets_assigned_agent;

-- Recreate the foreign key constraints properly
ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_assigned_agent_fkey 
FOREIGN KEY (assigned_agent) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Fix the is_admin function to ONLY check profiles table for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$function$;

-- Ensure the current admin user has proper admin role in profiles table
-- Update the profile role to admin if it's not already set
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@picnify.com' OR email ILIKE '%admin%'
AND role != 'admin';

-- Create some test live chat tickets for testing if none exist
INSERT INTO public.support_tickets (
  created_by,
  subject,
  description,
  priority,
  status,
  category
)
SELECT 
  p.id,
  'Live Chat Session - Test Customer',
  '{"customer_details":{"name":"Test User","email":"test@example.com","issue_type":"booking"},"conversation_summary":[{"role":"user","content":"Hello, I need help"},{"role":"assistant","content":"Hi! How can I help you today?"}]}',
  'medium',
  'open',
  'Technical'
FROM public.profiles p 
WHERE p.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create a more permissive policy for support tickets to help with debugging
DROP POLICY IF EXISTS "Debug admin access to tickets" ON public.support_tickets;
CREATE POLICY "Debug admin access to tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    -- Allow access if user has admin role in profiles table only
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Also create a more permissive policy for support ticket messages
DROP POLICY IF EXISTS "Debug admin access to messages" ON public.support_ticket_messages;
CREATE POLICY "Debug admin access to messages"
  ON public.support_ticket_messages
  FOR SELECT
  USING (
    -- Allow access if user has admin role in profiles table only
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create a simple test query to verify admin access
-- This will help debug if the issue is with the data or permissions
CREATE OR REPLACE FUNCTION public.test_admin_access()
RETURNS TABLE(
  user_id uuid,
  email text,
  profile_role text,
  has_admin_in_profiles boolean,
  has_admin_in_user_roles boolean,
  is_admin_result boolean,
  total_tickets bigint,
  live_chat_tickets bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH user_info AS (
    SELECT 
      auth.uid() as uid,
      p.email,
      p.role as profile_role,
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ) as has_admin_in_profiles,
      false as has_admin_in_user_roles, -- Not checking user_roles table anymore
      public.is_admin() as is_admin_result
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ),
  ticket_counts AS (
    SELECT 
      COUNT(*) as total_tickets,
      COUNT(*) FILTER (WHERE subject ILIKE '%Live Chat%') as live_chat_tickets
    FROM public.support_tickets
  )
  SELECT 
    ui.uid,
    ui.email,
    ui.profile_role,
    ui.has_admin_in_profiles,
    ui.has_admin_in_user_roles,
    ui.is_admin_result,
    tc.total_tickets,
    tc.live_chat_tickets
  FROM user_info ui
  CROSS JOIN ticket_counts tc;
$$;
