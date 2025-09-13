-- Test Commission Data - Quick verification script
-- Run this to check if commission data exists and is accessible

-- 1. Check if agent_commissions table has data
SELECT 'Agent Commissions Count:' as info, COUNT(*) as count FROM public.agent_commissions;

-- 2. Show all commission records with details
SELECT 
  'Commission Records:' as info,
  ac.id,
  ac.agent_id,
  ac.booking_id,
  ac.commission_rate,
  ac.booking_amount,
  ac.commission_amount,
  ac.status,
  b.check_in_date,
  b.check_out_date,
  p.title as property_title,
  agent_profile.full_name as agent_name,
  owner_profile.full_name as owner_name
FROM public.agent_commissions ac
JOIN public.bookings b ON b.id = ac.booking_id
LEFT JOIN public.properties p ON p.id = b.property_id
LEFT JOIN public.profiles agent_profile ON agent_profile.id = ac.agent_id
LEFT JOIN public.profiles owner_profile ON owner_profile.id = b.user_id
ORDER BY ac.created_at DESC;

-- 3. Test the get_agent_commission_summary function
SELECT 'Agent Commission Summary:' as info;
SELECT public.get_agent_commission_summary('67af3277-e025-4cca-a504-b4f2d723f7ca'::UUID);

-- 4. Check commission settings
SELECT 'Commission Settings:' as info;
SELECT 
  acs.id,
  acs.agent_id,
  p.full_name as agent_name,
  acs.commission_rate,
  acs.is_active,
  acs.effective_from,
  acs.effective_until
FROM public.agent_commission_settings acs
JOIN public.profiles p ON p.id = acs.agent_id
ORDER BY acs.created_at DESC;

-- 5. Check if RLS policies are working
SELECT 'RLS Policy Check:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('agent_commissions', 'agent_commission_settings', 'agent_commission_payouts');

-- 6. Test admin access (replace with your admin user ID)
SELECT 'Admin Access Test:' as info;
SELECT 
  id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE role = 'admin';

-- 7. Show total commission amounts by status
SELECT 'Commission Summary by Status:' as info;
SELECT 
  status,
  COUNT(*) as count,
  SUM(commission_amount) as total_amount,
  AVG(commission_amount) as avg_amount
FROM public.agent_commissions
GROUP BY status
ORDER BY total_amount DESC;
