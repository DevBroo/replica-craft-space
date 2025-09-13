-- Test the fixed commission queries
-- This tests the simplified queries that should work without column alias issues

-- 1. Test basic agent_commissions query (what getCommissions uses)
SELECT 'Test 1: Basic agent_commissions query' as test;
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

-- 2. Test agent_commissions with bookings join (simplified)
SELECT 'Test 2: agent_commissions with bookings join' as test;
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

-- 3. Test agent_commissions with profiles join (for agent names)
SELECT 'Test 3: agent_commissions with profiles join' as test;
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
  b.property_id,
  p.full_name as agent_name,
  p.email as agent_email
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.profiles p ON p.id = ac.agent_id
ORDER BY ac.created_at DESC;

-- 4. Test revenue split calculation (what getRevenueSplitSummary uses)
SELECT 'Test 4: Revenue split calculation' as test;
SELECT 
  SUM(ac.commission_amount) as total_agent_commission,
  SUM(ac.booking_amount) as total_booking_amount,
  SUM(ac.booking_amount * 0.10) as total_admin_commission,
  SUM(ac.booking_amount - (ac.booking_amount * 0.10) - ac.commission_amount) as total_owner_share
FROM public.agent_commissions ac
WHERE ac.status != 'cancelled';

-- 5. Test with status filter
SELECT 'Test 5: With status filter (pending)' as test;
SELECT 
  COUNT(*) as count,
  SUM(ac.commission_amount) as total_agent_commission,
  SUM(ac.booking_amount) as total_booking_amount
FROM public.agent_commissions ac
WHERE ac.status = 'pending';

-- 6. Test with status filter (all)
SELECT 'Test 6: With status filter (all)' as test;
SELECT 
  COUNT(*) as count,
  SUM(ac.commission_amount) as total_agent_commission,
  SUM(ac.booking_amount) as total_booking_amount
FROM public.agent_commissions ac
WHERE ac.status != 'cancelled';

-- 7. Test pagination (limit and offset)
SELECT 'Test 7: Pagination test' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status
FROM public.agent_commissions ac
ORDER BY ac.created_at DESC
LIMIT 10 OFFSET 0;

-- 8. Test sorting
SELECT 'Test 8: Sorting test' as test;
SELECT 
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_amount,
  ac.status,
  ac.created_at
FROM public.agent_commissions ac
ORDER BY ac.commission_amount DESC
LIMIT 5;
