
-- 1) Add "created_by" to profiles to track who invited/created the owner
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- Optional (safer queries): add a foreign key to profiles.id
-- Note: This will be NULL for historical rows and for users created via normal signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_created_by_fkey'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_created_by_fkey
      FOREIGN KEY (created_by)
      REFERENCES public.profiles (id)
      ON UPDATE NO ACTION
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2) Add "commission_rate" to profiles (0.0 - 1.0), default 10%
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 0.10;

-- Ensure commission_rate is within [0,1]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_commission_rate_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_commission_rate_check
      CHECK (commission_rate >= 0 AND commission_rate <= 1);
  END IF;
END $$;

-- 3) Admin activity logs per owner
CREATE TABLE IF NOT EXISTS public.owner_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.profiles (id),
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.owner_admin_actions ENABLE ROW LEVEL SECURITY;

-- Admins can select/insert/update/delete (manage) all logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'owner_admin_actions'
      AND policyname = 'Admins can manage owner_admin_actions'
  ) THEN
    CREATE POLICY "Admins can manage owner_admin_actions"
      ON public.owner_admin_actions
      FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS owner_admin_actions_owner_id_idx ON public.owner_admin_actions (owner_id);
CREATE INDEX IF NOT EXISTS owner_admin_actions_admin_id_idx ON public.owner_admin_actions (admin_id);
CREATE INDEX IF NOT EXISTS owner_admin_actions_created_at_idx ON public.owner_admin_actions (created_at);
