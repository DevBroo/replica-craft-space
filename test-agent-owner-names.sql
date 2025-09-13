-- Test Agent and Owner Names
-- This script verifies that agent and owner names are properly stored and can be retrieved

-- 1. Check agent commissions with agent names
SELECT 'Test 1: Agent Commissions with Agent Names' as test;
SELECT 
  ac.id as commission_id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status,
  p.full_name as agent_name,
  p.email as agent_email
FROM public.agent_commissions ac
LEFT JOIN public.profiles p ON p.id = ac.agent_id
ORDER BY ac.created_at DESC;

-- 2. Check bookings with owner names
SELECT 'Test 2: Bookings with Owner Names' as test;
SELECT 
  b.id as booking_id,
  b.user_id,
  b.agent_id,
  b.total_amount,
  b.status as booking_status,
  p.full_name as owner_name,
  p.email as owner_email
FROM public.bookings b
LEFT JOIN public.profiles p ON p.id = b.user_id
WHERE b.agent_id IS NOT NULL
ORDER BY b.created_at DESC;

-- 3. Check complete commission data with both agent and owner names
SELECT 'Test 3: Complete Commission Data' as test;
SELECT 
  ac.id as commission_id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status as commission_status,
  agent_p.full_name as agent_name,
  agent_p.email as agent_email,
  owner_p.full_name as owner_name,
  owner_p.email as owner_email,
  b.check_in_date,
  b.check_out_date,
  b.total_amount as booking_amount
FROM public.agent_commissions ac
LEFT JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.profiles agent_p ON agent_p.id = ac.agent_id
LEFT JOIN public.profiles owner_p ON owner_p.id = b.user_id
ORDER BY ac.created_at DESC;

-- 4. Check if there are any NULL agent names
SELECT 'Test 4: Check for NULL Agent Names' as test;
SELECT 
  COUNT(*) as total_commissions,
  COUNT(agent_p.full_name) as commissions_with_agent_names,
  COUNT(*) - COUNT(agent_p.full_name) as commissions_without_agent_names
FROM public.agent_commissions ac
LEFT JOIN public.profiles agent_p ON agent_p.id = ac.agent_id;

-- 5. Check if there are any NULL owner names
SELECT 'Test 5: Check for NULL Owner Names' as test;
SELECT 
  COUNT(*) as total_bookings_with_agents,
  COUNT(owner_p.full_name) as bookings_with_owner_names,
  COUNT(*) - COUNT(owner_p.full_name) as bookings_without_owner_names
FROM public.bookings b
LEFT JOIN public.profiles owner_p ON owner_p.id = b.user_id
WHERE b.agent_id IS NOT NULL;

-- 6. Check agent profiles
SELECT 'Test 6: Agent Profiles' as test;
SELECT 
  id,
  full_name,
  email,
  role,
  commission_rate,
  created_at
FROM public.profiles
WHERE role = 'agent'
ORDER BY created_at DESC;

-- 7. Check recent bookings with agent_id
SELECT 'Test 7: Recent Bookings with Agent ID' as test;
SELECT 
  b.id,
  b.user_id,
  b.agent_id,
  b.total_amount,
  b.status,
  b.created_at,
  agent_p.full_name as agent_name,
  owner_p.full_name as owner_name
FROM public.bookings b
LEFT JOIN public.profiles agent_p ON agent_p.id = b.agent_id
LEFT JOIN public.profiles owner_p ON owner_p.id = b.user_id
WHERE b.agent_id IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 10;
