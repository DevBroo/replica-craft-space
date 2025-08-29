
-- 1) Enums for KYC
do $$
begin
  create type public.kyc_type as enum ('aadhaar','pan','gst','business');
exception when duplicate_object then null;
end$$;

do $$
begin
  create type public.kyc_status as enum ('pending','verified','rejected');
exception when duplicate_object then null;
end$$;

-- 2) User security settings (2FA prefs, phone_verified, last password change)
create table if not exists public.user_security_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  require_2fa boolean not null default false,
  preferred_mfa_method text not null default 'email', -- 'totp' | 'sms' | 'email'
  phone_verified boolean not null default false,
  last_password_change timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_security_settings enable row level security;

-- Users can manage their own; admins can read all
create policy "Users manage own security settings"
  on public.user_security_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins view security settings"
  on public.user_security_settings
  for select
  using (public.is_admin());

-- 3) Password history (for reuse prevention + expiry calculation)
create table if not exists public.password_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  password_fingerprint text not null, -- never store raw password
  changed_at timestamptz not null default now()
);

create index if not exists idx_password_history_user on public.password_history(user_id, changed_at desc);

alter table public.password_history enable row level security;

create policy "Admins can view password history"
  on public.password_history
  for select
  using (public.is_admin());

create policy "Users can view own password history"
  on public.password_history
  for select
  using (auth.uid() = user_id);

create policy "Users insert own password history"
  on public.password_history
  for insert
  with check (auth.uid() = user_id);

-- 4) Login audit logs
create table if not exists public.login_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  event text not null check (event in ('login_success','login_failure','logout')),
  ip_address text,
  country text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_audit_user on public.login_audit(user_id, created_at desc);

alter table public.login_audit enable row level security;

create policy "Admins view all login audits"
  on public.login_audit
  for select
  using (public.is_admin());

create policy "Users view own login audits"
  on public.login_audit
  for select
  using (auth.uid() = user_id);

create policy "Users insert own login audits"
  on public.login_audit
  for insert
  with check (auth.uid() = user_id);

-- 5) Phone verification codes (OTP via edge functions)
create table if not exists public.phone_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_verif_user on public.phone_verification_codes(user_id, created_at desc);

alter table public.phone_verification_codes enable row level security;

-- Only admins can read/modify; users can insert their own request.
create policy "Admins manage phone verification codes"
  on public.phone_verification_codes
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users create own phone verification codes"
  on public.phone_verification_codes
  for insert
  with check (auth.uid() = user_id);

-- Validation trigger to ensure expires_at is in the future
create or replace function public.validate_phone_code_expiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if new.expires_at <= now() then
    raise exception 'expires_at must be in the future';
  end if;
  return new;
end;
$func$;

drop trigger if exists trg_validate_phone_code_expiry on public.phone_verification_codes;
create trigger trg_validate_phone_code_expiry
before insert on public.phone_verification_codes
for each row execute procedure public.validate_phone_code_expiry();

-- 6) KYC verifications (Agents/Owners)
create table if not exists public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.kyc_type not null,
  id_number_masked text, -- only masked value stored for display
  id_hash text,          -- hash of the ID number for de-duplication
  status public.kyc_status not null default 'pending',
  documents jsonb not null default '[]'::jsonb, -- array of storage paths
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  rejection_reason text
);

create index if not exists idx_kyc_user on public.kyc_verifications(user_id, submitted_at desc);

alter table public.kyc_verifications enable row level security;

create policy "Admins manage KYC"
  on public.kyc_verifications
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users submit/view own KYC"
  on public.kyc_verifications
  for select
  using (auth.uid() = user_id);

create policy "Users create own KYC"
  on public.kyc_verifications
  for insert
  with check (auth.uid() = user_id);

-- 7) Suspicious activity logs (geo jumps, repeated failures, ip blocked)
create table if not exists public.suspicious_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null, -- e.g., 'geo_change','many_failures','ip_blocked'
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_suspicious_user on public.suspicious_activity_logs(user_id, created_at desc);

alter table public.suspicious_activity_logs enable row level security;

create policy "Admins view suspicious activity"
  on public.suspicious_activity_logs
  for select
  using (public.is_admin());

create policy "Users view own suspicious activity"
  on public.suspicious_activity_logs
  for select
  using (auth.uid() = user_id);

create policy "Users insert own suspicious activity"
  on public.suspicious_activity_logs
  for insert
  with check (auth.uid() = user_id);

-- 8) Integration status referenced by NotificationSettings (prevents 500s)
create table if not exists public.api_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique, -- 'smtp' | 'twilio' | 'webpush' etc.
  configured boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.api_integrations enable row level security;

create policy "Admins manage api integrations"
  on public.api_integrations
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read api integrations"
  on public.api_integrations
  for select
  using (public.is_admin());
  