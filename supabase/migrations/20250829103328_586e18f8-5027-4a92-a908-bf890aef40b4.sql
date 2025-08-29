
-- 1) RBAC: roles enum + user_roles table + helpers

-- Create role enum for admin-side RBAC
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'super_admin',
      'admin',
      'support_admin',
      'notifications_admin',
      'finance_admin',
      'analytics_admin'
    );
  END IF;
END$$;

-- Roles table (separate from profiles) with RLS
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Stable, SECURITY DEFINER helper to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;

-- Broaden is_admin() without breaking existing logic:
-- Now true if profiles.role='admin' OR user has role 'admin' or 'super_admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin');
$function$;

-- Convenience helpers for fine-grained admin permissions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_support_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'support_admin') OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_notifications_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'notifications_admin') OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_finance_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'finance_admin') OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_analytics_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'analytics_admin') OR public.is_admin();
$$;

-- Policies for user_roles: only (super_)admins can manage
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins read roles" ON public.user_roles;

CREATE POLICY "Admins read roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_super_admin() OR public.is_admin())
  WITH CHECK (public.is_super_admin() OR public.is_admin());


-- 2) System-wide settings registry (non-secret values only)

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- e.g. 'general', 'security', 'branding', 'notifications', 'payments', 'integrations'
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_secret BOOLEAN NOT NULL DEFAULT false, -- track if value should be resolved via function secrets (never store secrets here)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES public.profiles(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS: only admins can read/write settings
DROP POLICY IF EXISTS "Admins read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;

CREATE POLICY "Admins read settings"
  ON public.app_settings
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage settings"
  ON public.app_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto update updated_at
DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 3) Admin bank details (for payouts) + masking + audit

CREATE TABLE IF NOT EXISTS public.admin_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  account_type TEXT,
  pan_number TEXT,
  upi_id TEXT,
  micr_code TEXT
);

ALTER TABLE public.admin_bank_details ENABLE ROW LEVEL SECURITY;

-- Admins and finance admins can manage/read
DROP POLICY IF EXISTS "Finance/Admin read bank details" ON public.admin_bank_details;
DROP POLICY IF EXISTS "Finance/Admin manage bank details" ON public.admin_bank_details;

CREATE POLICY "Finance/Admin read bank details"
  ON public.admin_bank_details
  FOR SELECT
  USING (public.is_finance_admin() OR public.is_admin());

CREATE POLICY "Finance/Admin manage bank details"
  ON public.admin_bank_details
  FOR ALL
  USING (public.is_finance_admin() OR public.is_admin())
  WITH CHECK (public.is_finance_admin() OR public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS admin_bank_details_set_updated_at ON public.admin_bank_details;
CREATE TRIGGER admin_bank_details_set_updated_at
BEFORE UPDATE ON public.admin_bank_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Audit table for admin bank detail access
CREATE TABLE IF NOT EXISTS public.admin_bank_details_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL, -- who viewed/updated
  access_type TEXT NOT NULL, -- 'view' | 'update'
  accessed_fields TEXT[] NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT NULL,
  user_agent TEXT NULL
);

ALTER TABLE public.admin_bank_details_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view, system can insert
DROP POLICY IF EXISTS "Admins view admin bank audit" ON public.admin_bank_details_audit;
DROP POLICY IF EXISTS "System insert admin bank audit" ON public.admin_bank_details_audit;

CREATE POLICY "Admins view admin bank audit"
  ON public.admin_bank_details_audit
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System insert admin bank audit"
  ON public.admin_bank_details_audit
  FOR INSERT
  WITH CHECK (true);

-- Masked safe view function (full for super_admin, masked for others)
CREATE OR REPLACE FUNCTION public.get_admin_bank_details_safe()
RETURNS TABLE(
  id uuid,
  account_holder_name text,
  bank_name text,
  branch_name text,
  account_number_masked text,
  ifsc_code text,
  account_type text,
  pan_number_masked text,
  upi_id_masked text,
  micr_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_super boolean := public.is_super_admin();
BEGIN
  IF NOT (public.is_finance_admin() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized to view admin bank details';
  END IF;

  -- Log view
  INSERT INTO public.admin_bank_details_audit(accessed_by, access_type, accessed_fields)
  VALUES (auth.uid(), 'view', ARRAY['account_number','pan_number','upi_id']);

  RETURN QUERY
  SELECT 
    abd.id,
    abd.account_holder_name,
    abd.bank_name,
    abd.branch_name,
    CASE 
      WHEN v_is_super THEN abd.account_number
      ELSE 'XXXX' || RIGHT(abd.account_number, 4)
    END AS account_number_masked,
    abd.ifsc_code,
    abd.account_type,
    CASE 
      WHEN v_is_super THEN abd.pan_number
      WHEN abd.pan_number IS NOT NULL THEN LEFT(abd.pan_number, 3) || 'XXXX' || RIGHT(abd.pan_number, 1)
      ELSE NULL
    END AS pan_number_masked,
    CASE 
      WHEN v_is_super THEN abd.upi_id
      WHEN abd.upi_id IS NOT NULL THEN LEFT(abd.upi_id, 3) || 'XXXX@' || SPLIT_PART(abd.upi_id, '@', 2)
      ELSE NULL
    END AS upi_id_masked,
    abd.micr_code
  FROM public.admin_bank_details abd;
END;
$$;


-- 4) IP Whitelist for admin access policies (enforcement via app logic / functions)

CREATE TABLE IF NOT EXISTS public.admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr TEXT NOT NULL, -- Store CIDR or single IP
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage IP whitelist" ON public.admin_ip_whitelist;
CREATE POLICY "Admins manage IP whitelist"
  ON public.admin_ip_whitelist
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS admin_ip_whitelist_set_updated_at ON public.admin_ip_whitelist;
CREATE TRIGGER admin_ip_whitelist_set_updated_at
BEFORE UPDATE ON public.admin_ip_whitelist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 5) API integrations registry (metadata only; secrets via function secrets)
CREATE TABLE IF NOT EXISTS public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,           -- 'stripe', 'razorpay', 'smtp', 'twilio', 'webpush'
  key_name TEXT NOT NULL,           -- display label for the secret (e.g., 'STRIPE_SECRET_KEY')
  configured BOOLEAN NOT NULL DEFAULT false, -- true when the corresponding secret is set
  last4 TEXT NULL,                  -- optional masked preview
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- public config e.g., region, sender id
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, key_name)
);

ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage integrations" ON public.api_integrations;
CREATE POLICY "Admins manage integrations"
  ON public.api_integrations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS api_integrations_set_updated_at ON public.api_integrations;
CREATE TRIGGER api_integrations_set_updated_at
BEFORE UPDATE ON public.api_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 6) System audit logs for admin actions
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,          -- e.g. 'update_setting', 'upload_logo', 'update_roles'
  entity_type TEXT NULL,         -- 'app_settings','admin_bank_details','user_roles','smtp','stripe', etc
  entity_id UUID NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit" ON public.system_audit_logs;
DROP POLICY IF EXISTS "Admins insert audit" ON public.system_audit_logs;

CREATE POLICY "Admins read audit"
  ON public.system_audit_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins insert audit"
  ON public.system_audit_logs
  FOR INSERT
  WITH CHECK (public.is_admin());


-- 7) Web Push subscriptions (for future push notifications)
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Admins read subscriptions" ON public.web_push_subscriptions;

CREATE POLICY "Users manage own subscriptions"
  ON public.web_push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read subscriptions"
  ON public.web_push_subscriptions
  FOR SELECT
  USING (public.is_admin());

DROP TRIGGER IF EXISTS web_push_subscriptions_set_updated_at ON public.web_push_subscriptions;
CREATE TRIGGER web_push_subscriptions_set_updated_at
BEFORE UPDATE ON public.web_push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 8) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON public.api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_admin_ip_whitelist_active ON public.admin_ip_whitelist(is_active);

