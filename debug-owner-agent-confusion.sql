-- Debug Owner vs Agent Confusion
-- This script helps identify why owner names are showing as agent names

-- 1. Check the booking data structure
SELECT 'Test 1: Booking Data Structure' as test;
SELECT 
  b.id as booking_id,
  b.user_id,
  b.agent_id,
  b.total_amount,
  b.status,
  b.created_at,
  -- Check if user_id and agent_id are the same
  CASE 
    WHEN b.user_id = b.agent_id THEN 'SAME PERSON'
    ELSE 'DIFFERENT PEOPLE'
  END as user_agent_relationship
FROM public.bookings b
WHERE b.agent_id IS NOT NULL
ORDER BY b.created_at DESC;

-- 2. Check who the user_id actually refers to
SELECT 'Test 2: Who is user_id?' as test;
SELECT 
  b.id as booking_id,
  b.user_id,
  b.agent_id,
  user_p.full_name as user_name,
  user_p.role as user_role,
  agent_p.full_name as agent_name,
  agent_p.role as agent_role
FROM public.bookings b
LEFT JOIN public.profiles user_p ON user_p.id = b.user_id
LEFT JOIN public.profiles agent_p ON agent_p.id = b.agent_id
WHERE b.agent_id IS NOT NULL
ORDER BY b.created_at DESC;

-- 3. Check if user_id should be the property owner
SELECT 'Test 3: Property Owner Check' as test;
SELECT 
  b.id as booking_id,
  b.user_id,
  b.agent_id,
  b.property_id,
  user_p.full_name as user_name,
  user_p.role as user_role,
  agent_p.full_name as agent_name,
  agent_p.role as agent_role,
  prop.title as property_title,
  prop.owner_id as property_owner_id,
  owner_p.full_name as property_owner_name
FROM public.bookings b
LEFT JOIN public.profiles user_p ON user_p.id = b.user_id
LEFT JOIN public.profiles agent_p ON agent_p.id = b.agent_id
LEFT JOIN public.properties prop ON prop.id = b.property_id
LEFT JOIN public.profiles owner_p ON owner_p.id = prop.owner_id
WHERE b.agent_id IS NOT NULL
ORDER BY b.created_at DESC;

-- 4. Check commission data with correct owner
SELECT 'Test 4: Commission with Correct Owner' as test;
SELECT 
  ac.id as commission_id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  agent_p.full_name as agent_name,
  -- Use property owner instead of booking user
  prop_owner_p.full_name as property_owner_name,
  b.user_id as booking_user_id,
  user_p.full_name as booking_user_name,
  prop.title as property_title
FROM public.agent_commissions ac
LEFT JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.profiles agent_p ON agent_p.id = ac.agent_id
LEFT JOIN public.profiles user_p ON user_p.id = b.user_id
LEFT JOIN public.properties prop ON prop.id = b.property_id
LEFT JOIN public.profiles prop_owner_p ON prop_owner_p.id = prop.owner_id
ORDER BY ac.created_at DESC;
