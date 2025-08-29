
-- 1) Enums (create if missing)
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='mfa_method' and n.nspname='public') then
    create type public.mfa_method as enum ('sms','totp','email');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='security_rule_type' and n.nspname='public') then
    create type public.security_rule_type as enum ('allow','block');
  end if;
end$$;

-- 2) Module permissions for granular access control
create table if not exists public.module_permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  role public.app_role not null,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_key, role)
);
alter table public.module_permissions enable row level security;

-- RLS: admins manage all
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='module_permissions' and policyname='Admins manage module permissions') then
    create policy "Admins manage module permissions"
      on public.module_permissions
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RLS: authenticated can read (to gate UI without leaking secrets)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='module_permissions' and policyname='Authenticated can read module permissions') then
    create policy "Authenticated can read module permissions"
      on public.module_permissions
      for select
      using (auth.role() = 'authenticated');
  end if;
end$$;

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = 'public.module_permissions'::regclass and tgname = 'trg_module_permissions_updated_at'
  ) then
    create trigger trg_module_permissions_updated_at
      before update on public.module_permissions
      for each row
      execute procedure public.update_updated_at_column();
  end if;
end$$;

-- helper: can_access_module(module_key, action)
create or replace function public.can_access_module(p_module_key text, p_action text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.module_permissions mp
    where mp.module_key = p_module_key
      and (
        public.has_role(auth.uid(), mp.role)
      )
      and (
        case
          when lower(p_action) = 'edit' then mp.can_edit
          else mp.can_view
        end
      )
  );
$$;

-- 3) Device management
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_id text not null,
  device_name text,
  user_agent text,
  ip_address text,
  country text,
  region text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id, device_id)
);
alter table public.user_devices enable row level security;

-- RLS: admin manage all
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_devices' and policyname='Admins manage devices') then
    create policy "Admins manage devices"
      on public.user_devices
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RLS: users manage own devices
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_devices' and policyname='Users manage own devices') then
    create policy "Users manage own devices"
      on public.user_devices
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = 'public.user_devices'::regclass and tgname = 'trg_user_devices_updated_at'
  ) then
    create trigger trg_user_devices_updated_at
      before update on public.user_devices
      for each row
      execute procedure public.update_updated_at_column();
  end if;
end$$;

-- 4) Geo restrictions
create table if not exists public.security_geo_rules (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  rule_type public.security_rule_type not null,
  country_code text not null, -- ISO 3166-1 alpha-2
  role public.app_role,       -- optional scope by role
  user_id uuid,               -- optional scope by user
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.security_geo_rules enable row level security;

-- RLS: admin manage & read
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='security_geo_rules' and policyname='Admins manage geo rules') then
    create policy "Admins manage geo rules"
      on public.security_geo_rules
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = 'public.security_geo_rules'::regclass and tgname = 'trg_security_geo_rules_updated_at'
  ) then
    create trigger trg_security_geo_rules_updated_at
      before update on public.security_geo_rules
      for each row
      execute procedure public.update_updated_at_column();
  end if;
end$$;

-- 5) Login auditing
create table if not exists public.login_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  success boolean not null,
  failure_reason text,
  ip_address text,
  user_agent text,
  country text,
  region text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.login_audit enable row level security;

-- RLS: admins read all
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='login_audit' and policyname='Admins read login audit') then
    create policy "Admins read login audit"
      on public.login_audit
      for select
      using (public.is_admin());
  end if;
end$$;

-- RLS: users read their own
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='login_audit' and policyname='Users read their login audit') then
    create policy "Users read their login audit"
      on public.login_audit
      for select
      using (auth.uid() = user_id);
  end if;
end$$;

-- RLS: allow inserts from client/system (no user_id yet for failed anon attempts)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='login_audit' and policyname='Insert login audit (system)') then
    create policy "Insert login audit (system)"
      on public.login_audit
      for insert
      with check (true);
  end if;
end$$;

-- helper to log attempts with stable interface
create or replace function public.log_login_attempt(
  p_user_id uuid,
  p_email text,
  p_success boolean,
  p_failure_reason text,
  p_ip_address text,
  p_user_agent text,
  p_country text,
  p_region text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.login_audit(user_id, email, success, failure_reason, ip_address, user_agent, country, region, metadata)
  values (p_user_id, p_email, p_success, p_failure_reason, p_ip_address, p_user_agent, p_country, p_region, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- 6) 2FA enrollments
create table if not exists public.user_mfa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method public.mfa_method not null,
  enabled boolean not null default false,
  -- TOTP
  totp_secret text,
  -- SMS
  phone text,
  -- Email fallback
  email text,
  -- Recovery
  backup_codes_hashed text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique(user_id, method)
);
alter table public.user_mfa enable row level security;

-- RLS: admin manage all
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_mfa' and policyname='Admins manage MFA') then
    create policy "Admins manage MFA"
      on public.user_mfa
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RLS: users manage own MFA
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_mfa' and policyname='Users manage own MFA') then
    create policy "Users manage own MFA"
      on public.user_mfa
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = 'public.user_mfa'::regclass and tgname = 'trg_user_mfa_updated_at'
  ) then
    create trigger trg_user_mfa_updated_at
      before update on public.user_mfa
      for each row
      execute procedure public.update_updated_at_column();
  end if;
end$$;

-- 7) MFA challenges (OTPs, TOTP verifications)
create table if not exists public.mfa_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method public.mfa_method not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.mfa_challenges enable row level security;

-- RLS: admin read all
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mfa_challenges' and policyname='Admins read challenges') then
    create policy "Admins read challenges"
      on public.mfa_challenges
      for select
      using (public.is_admin());
  end if;
end$$;

-- RLS: user read own
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mfa_challenges' and policyname='Users read own challenges') then
    create policy "Users read own challenges"
      on public.mfa_challenges
      for select
      using (auth.uid() = user_id);
  end if;
end$$;

-- RLS: insert challenges (by client/edge)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mfa_challenges' and policyname='Insert challenges') then
    create policy "Insert challenges"
      on public.mfa_challenges
      for insert
      with check (true);
  end if;
end$$;

-- RLS: update (consume) own challenges or admin
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mfa_challenges' and policyname='Update own challenges or admin') then
    create policy "Update own challenges or admin"
      on public.mfa_challenges
      for update
      using (public.is_admin() or auth.uid() = user_id)
      with check (public.is_admin() or auth.uid() = user_id);
  end if;
end$$;

-- Validate expiry in future
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = 'public.mfa_challenges'::regclass and tgname = 'trg_mfa_challenges_validate_expiry'
  ) then
    create trigger trg_mfa_challenges_validate_expiry
      before insert on public.mfa_challenges
      for each row
      execute procedure public.validate_phone_code_expiry();
  end if;
end$$;

-- 8) Backup codes (hashed)
create table if not exists public.mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, code_hash)
);
alter table public.mfa_backup_codes enable row level security;

-- RLS: admin read
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mfa_backup_codes' and policyname='Admins read backup codes') then
    create policy "Admins read backup codes"
      on public.mfa_backup_codes
      for select
      using (public.is_admin());
  end if;
end$$;

-- RLS: user manage own
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mfa_backup_codes' and policyname='Users manage own backup codes') then
    create policy "Users manage own backup codes"
      on public.mfa_backup_codes
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- 9) Escalation rules & alerts
create table if not exists public.security_escalation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique, -- e.g., "failed_logins_burst"
  description text,
  threshold integer not null,
  window_minutes integer not null,
  notify_roles public.app_role[] not null default '{admin}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.security_escalation_rules enable row level security;

-- RLS: admin manage
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='security_escalation_rules' and policyname='Admins manage escalation rules') then
    create policy "Admins manage escalation rules"
      on public.security_escalation_rules
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = 'public.security_escalation_rules'::regclass and tgname = 'trg_security_escalation_rules_updated_at'
  ) then
    create trigger trg_security_escalation_rules_updated_at
      before update on public.security_escalation_rules
      for each row
      execute procedure public.update_updated_at_column();
  end if;
end$$;

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,      -- e.g., "unusual_activity", "geo_block", etc.
  severity text not null default 'medium', -- low/medium/high
  message text not null,
  status text not null default 'open', -- open/resolved
  escalated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.security_alerts enable row level security;

-- RLS: admin manage all
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='security_alerts' and policyname='Admins manage security alerts') then
    create policy "Admins manage security alerts"
      on public.security_alerts
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RLS: user read own alerts
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='security_alerts' and policyname='Users read own alerts') then
    create policy "Users read own alerts"
      on public.security_alerts
      for select
      using (auth.uid() = user_id);
  end if;
end$$;

-- 10) Seed initial module permissions (safe no-op if exists)
insert into public.module_permissions(module_key, role, can_view, can_edit)
select v.module_key, v.role::public.app_role, v.can_view, v.can_edit
from (values
  -- Example modules we’ll gate in UI
  ('admin.settings.security', 'admin', true, true),
  ('admin.settings.security', 'moderator', true, false),
  ('admin.settings.security', 'user', false, false),
  ('admin.settings.security', 'agent', false, false),
  ('admin.device-management', 'admin', true, true),
  ('admin.geo-restrictions', 'admin', true, true),
  ('admin.audit', 'admin', true, true)
) as v(module_key, role, can_view, can_edit)
on conflict (module_key, role) do nothing;
