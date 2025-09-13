-- Fix Commission Rate Check Constraint
-- The error shows that profiles_commission_rate_check is blocking commission_rate = 5.00

-- 1. Check the current constraint definition
SELECT 'Current constraint definition:' as info;
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'profiles_commission_rate_check';

-- 2. Check what values are currently in the commission_rate column
SELECT 'Current commission_rate values:' as info;
SELECT 
  commission_rate,
  COUNT(*) as count
FROM public.profiles
WHERE commission_rate IS NOT NULL
GROUP BY commission_rate
ORDER BY commission_rate;

-- 3. Check the data type and constraints on commission_rate column
SELECT 'Column definition:' as info;
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'commission_rate';

-- 4. Drop the problematic constraint
SELECT 'Dropping the constraint...' as info;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_commission_rate_check;

-- 5. Create a new, more flexible constraint
SELECT 'Creating new constraint...' as info;
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_commission_rate_check 
CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100));

-- 6. Test updating a commission rate
SELECT 'Testing commission rate update...' as info;
UPDATE public.profiles
SET commission_rate = 5.00
WHERE id = (
  SELECT id FROM public.profiles 
  WHERE role = 'agent' 
  LIMIT 1
)
RETURNING id, full_name, commission_rate;

-- 7. Test inserting a new commission setting
SELECT 'Testing commission setting insert...' as info;
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

-- 8. Verify the constraint is working
SELECT 'Verifying new constraint...' as info;
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'profiles_commission_rate_check';
