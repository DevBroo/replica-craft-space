-- Debug Commission Rate Update Issue
-- This script helps identify why commission rate updates are not working

-- 1. Check current commission settings for agents
SELECT 'Test 1: Current Commission Settings' as test;
SELECT 
  acs.id,
  acs.agent_id,
  acs.commission_rate,
  acs.is_active,
  acs.effective_from,
  acs.effective_until,
  acs.created_at,
  p.full_name as agent_name
FROM public.agent_commission_settings acs
LEFT JOIN public.profiles p ON p.id = acs.agent_id
ORDER BY acs.created_at DESC;

-- 2. Check profiles table commission rates
SELECT 'Test 2: Profiles Commission Rates' as test;
SELECT 
  id,
  full_name,
  email,
  role,
  commission_rate,
  updated_at
FROM public.profiles
WHERE role = 'agent'
ORDER BY updated_at DESC;

-- 3. Test updating a commission rate manually
SELECT 'Test 3: Manual Commission Rate Update Test' as test;
-- First, let's see what happens when we try to update

-- Check if we can update the profiles table
UPDATE public.profiles
SET commission_rate = 5.00
WHERE id = (
  SELECT id FROM public.profiles 
  WHERE role = 'agent' 
  LIMIT 1
);

-- Check if we can insert into agent_commission_settings
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
);

-- 4. Check RLS policies on agent_commission_settings
SELECT 'Test 4: Check RLS Policies' as test;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'agent_commission_settings';

-- 5. Check if user has admin role
SELECT 'Test 5: Check Current User Role' as test;
SELECT 
  auth.uid() as current_user_id,
  p.full_name,
  p.role,
  p.is_active
FROM public.profiles p
WHERE p.id = auth.uid();

-- 6. Test the exact update operation that should happen
SELECT 'Test 6: Test Update Operation' as test;
-- This simulates what the frontend should do

-- Step 1: Deactivate current settings
UPDATE public.agent_commission_settings
SET 
  is_active = false,
  effective_until = now()
WHERE agent_id = (
  SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1
)
AND is_active = true;

-- Step 2: Insert new setting
INSERT INTO public.agent_commission_settings (
  agent_id,
  commission_rate,
  is_active,
  effective_from,
  created_by
) VALUES (
  (SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1),
  5.00,
  true,
  now(),
  auth.uid()
);

-- Step 3: Update profile
UPDATE public.profiles
SET commission_rate = 5.00
WHERE id = (
  SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1
);

-- 7. Check the results
SELECT 'Test 7: Check Results' as test;
SELECT 
  acs.id,
  acs.agent_id,
  acs.commission_rate,
  acs.is_active,
  p.full_name as agent_name,
  p.commission_rate as profile_rate
FROM public.agent_commission_settings acs
LEFT JOIN public.profiles p ON p.id = acs.agent_id
WHERE acs.agent_id = (
  SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1
)
ORDER BY acs.created_at DESC;
