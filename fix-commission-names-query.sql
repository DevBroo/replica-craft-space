-- Fix Commission Names Query
-- This script shows the proper way to get agent and owner names from profiles table

-- 1. Test the current commission data with proper joins
SELECT 'Test 1: Commission Data with Agent and Owner Names' as test;
SELECT 
  ac.id as commission_id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status as commission_status,
  ac.created_at as commission_created,
  
  -- Agent information
  agent_p.full_name as agent_name,
  agent_p.email as agent_email,
  
  -- Owner information (from booking user_id)
  owner_p.full_name as owner_name,
  owner_p.email as owner_email,
  
  -- Booking information
  b.check_in_date,
  b.check_out_date,
  b.total_amount as booking_amount,
  b.status as booking_status,
  
  -- Property information
  prop.title as property_title,
  prop.address as property_address
  
FROM public.agent_commissions ac
LEFT JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.profiles agent_p ON agent_p.id = ac.agent_id
LEFT JOIN public.profiles owner_p ON owner_p.id = b.user_id
LEFT JOIN public.properties prop ON prop.id = b.property_id
ORDER BY ac.created_at DESC;

-- 2. Check if profiles exist for the agent and owner IDs
SELECT 'Test 2: Check Profiles for Agent and Owner IDs' as test;
SELECT 
  'Agent Profiles' as profile_type,
  p.id,
  p.full_name,
  p.email,
  p.role
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT agent_id 
  FROM public.agent_commissions 
  WHERE agent_id IS NOT NULL
)

UNION ALL

SELECT 
  'Owner Profiles' as profile_type,
  p.id,
  p.full_name,
  p.email,
  p.role
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT b.user_id 
  FROM public.bookings b
  WHERE b.agent_id IS NOT NULL
)
ORDER BY profile_type, full_name;

-- 3. Check for missing profiles
SELECT 'Test 3: Check for Missing Profiles' as test;
SELECT 
  'Missing Agent Profiles' as issue_type,
  ac.agent_id,
  COUNT(*) as commission_count
FROM public.agent_commissions ac
LEFT JOIN public.profiles p ON p.id = ac.agent_id
WHERE p.id IS NULL
GROUP BY ac.agent_id

UNION ALL

SELECT 
  'Missing Owner Profiles' as issue_type,
  b.user_id,
  COUNT(*) as booking_count
FROM public.bookings b
LEFT JOIN public.profiles p ON p.id = b.user_id
WHERE b.agent_id IS NOT NULL AND p.id IS NULL
GROUP BY b.user_id;

-- 4. Simple test to verify the join works
SELECT 'Test 4: Simple Join Test' as test;
SELECT 
  ac.id,
  ac.agent_id,
  agent_p.full_name as agent_name,
  b.user_id,
  owner_p.full_name as owner_name
FROM public.agent_commissions ac
LEFT JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.profiles agent_p ON agent_p.id = ac.agent_id
LEFT JOIN public.profiles owner_p ON owner_p.id = b.user_id
LIMIT 5;
