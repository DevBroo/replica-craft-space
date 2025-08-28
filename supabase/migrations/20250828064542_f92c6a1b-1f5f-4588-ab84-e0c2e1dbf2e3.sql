
-- Promote current user to admin so admin-analytics can be accessed
UPDATE public.profiles
SET role = 'admin',
    is_active = TRUE,
    updated_at = NOW()
WHERE id = '67af3277-e025-4cca-a504-b4f2d723f7ca';
