-- Simple Test for Names Fetch
-- This tests the approach we're using in the frontend

-- 1. Get commission data with IDs
SELECT 'Step 1: Get Commission Data with IDs' as test;
SELECT 
  ac.id as commission_id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status,
  b.user_id as owner_id,
  b.check_in_date,
  b.check_out_date,
  b.total_amount
FROM public.agent_commissions ac
LEFT JOIN public.bookings b ON b.id = ac.booking_id
ORDER BY ac.created_at DESC
LIMIT 5; 

-- 2. Get agent names for the agent IDs
SELECT 'Step 2: Get Agent Names' as test;
SELECT 
  p.id,
  p.full_name as agent_name,
  p.email as agent_email
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT agent_id 
  FROM public.agent_commissions 
  WHERE agent_id IS NOT NULL
);

-- 3. Get owner names for the owner IDs
SELECT 'Step 3: Get Owner Names' as test;
SELECT 
  p.id,
  p.full_name as owner_name,
  p.email as owner_email
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT b.user_id 
  FROM public.bookings b
  WHERE b.agent_id IS NOT NULL
);

-- 4. Combined result (what the frontend should get)
SELECT 'Step 4: Combined Result' as test;
SELECT 
  ac.id as commission_id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status,
  agent_p.full_name as agent_name,
  owner_p.full_name as owner_name,
  b.check_in_date,
  b.check_out_date,
  b.total_amount
FROM public.agent_commissions ac
LEFT JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.profiles agent_p ON agent_p.id = ac.agent_id
LEFT JOIN public.profiles owner_p ON owner_p.id = b.user_id
ORDER BY ac.created_at DESC
LIMIT 5;
