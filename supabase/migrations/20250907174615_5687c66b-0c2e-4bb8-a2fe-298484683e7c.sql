
-- 1) Add missing bio fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[];

-- 2) Backfill languages to an empty array for existing rows (optional but helpful)
UPDATE public.profiles
SET languages = '{}'::text[]
WHERE languages IS NULL;

-- 3) Refresh PostgREST schema cache so the new columns are recognized immediately
NOTIFY pgrst, 'reload schema';
