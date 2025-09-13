-- Test the exact query that the admin panel uses
-- This will help us debug why the admin panel shows empty data

-- 1. Test the basic agent_commissions query
SELECT 'Basic agent_commissions query:' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  ac.created_at
FROM public.agent_commissions ac
ORDER BY ac.created_at DESC;

-- 2. Test the query with bookings join
SELECT 'Query with bookings join:' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  b.id as booking_id_check,
  b.check_in_date,
  b.check_out_date,
  b.total_amount,
  b.status as booking_status,
  b.user_id,
  b.property_id
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
ORDER BY ac.created_at DESC;

-- 3. Test the query with properties join
SELECT 'Query with properties join:' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  b.check_in_date,
  b.check_out_date,
  b.total_amount,
  b.status as booking_status,
  p.id as property_id,
  p.title as property_title,
  p.address
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.properties p ON p.id = b.property_id
ORDER BY ac.created_at DESC;

-- 4. Test the query with agent profiles join
SELECT 'Query with agent profiles join:' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  b.check_in_date,
  b.check_out_date,
  b.total_amount,
  b.status as booking_status,
  p.title as property_title,
  agent_profile.id as agent_profile_id,
  agent_profile.full_name as agent_name,
  agent_profile.email as agent_email
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.properties p ON p.id = b.property_id
LEFT JOIN public.profiles agent_profile ON agent_profile.id = ac.agent_id
ORDER BY ac.created_at DESC;

-- 5. Test the complete query structure (similar to what the admin panel uses)
SELECT 'Complete query structure:' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  ac.created_at,
  ac.updated_at,
  b.check_in_date,
  b.check_out_date,
  b.total_amount,
  b.status as booking_status,
  b.user_id,
  b.property_id,
  p.title as property_title,
  p.address,
  agent_profile.full_name as agent_name,
  agent_profile.email as agent_email
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.properties p ON p.id = b.property_id
LEFT JOIN public.profiles agent_profile ON agent_profile.id = ac.agent_id
ORDER BY ac.created_at DESC;

-- 6. Test the revenue split calculation
SELECT 'Revenue split calculation:' as test;
SELECT 
  SUM(ac.commission_amount) as total_agent_commission,
  SUM(ac.booking_amount) as total_booking_amount,
  SUM(ac.booking_amount * 0.10) as total_admin_commission,
  SUM(ac.booking_amount - (ac.booking_amount * 0.10) - ac.commission_amount) as total_owner_share
FROM public.agent_commissions ac
WHERE ac.status != 'cancelled';

-- 7. Check if there are any RLS policy issues
SELECT 'RLS Policy Check:' as test;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'agent_commissions';

-- 8. Test admin user access
SELECT 'Admin user check:' as test;
SELECT 
  id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE role = 'admin';
