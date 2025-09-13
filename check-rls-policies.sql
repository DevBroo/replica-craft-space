-- Check RLS Policies for Commission Updates
-- This script checks if RLS policies are blocking commission rate updates

-- 1. Check RLS policies on agent_commission_settings
SELECT 'RLS Policies on agent_commission_settings:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'agent_commission_settings'
ORDER BY policyname;

-- 2. Check RLS policies on profiles
SELECT 'RLS Policies on profiles:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check if RLS is enabled on these tables
SELECT 'RLS Status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('agent_commission_settings', 'profiles')
ORDER BY tablename;

-- 4. Test if we can insert into agent_commission_settings
SELECT 'Testing insert into agent_commission_settings...' as info;

-- Try to insert a test record
INSERT INTO public.agent_commission_settings (
  agent_id,
  commission_rate,
  is_active,
  effective_from
) VALUES (
  (SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1),
  5.00,
  true,
  now()
) RETURNING *;

-- 5. Test if we can update profiles
SELECT 'Testing update on profiles...' as info;

-- Try to update a test record
UPDATE public.profiles
SET commission_rate = 5.00
WHERE id = (
  SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1
)
RETURNING id, full_name, commission_rate;

-- 6. Check current user context
SELECT 'Current user context:' as info;
SELECT 
  auth.uid() as user_id,
  auth.role() as user_role,
  current_user as db_user;

-- 7. Check if user has admin role
SELECT 'User admin status:' as info;
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.is_active,
  CASE 
    WHEN p.role = 'admin' THEN 'IS ADMIN'
    ELSE 'NOT ADMIN'
  END as admin_status
FROM public.profiles p
WHERE p.id = auth.uid();
