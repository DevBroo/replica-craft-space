
-- 1) Agent profiles
create table if not exists public.agent_profiles (
  user_id uuid primary key,
  coverage_area text,
  aadhar_number text,
  pan_number text,
  joining_date date,
  status text not null default 'active',
  notes text,
  documents jsonb not null default '{}'::jsonb,
  commission_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_profiles enable row level security;

-- Admins can manage agent_profiles
create policy "Admins can manage agent_profiles"
  on public.agent_profiles
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Agents can insert their agent_profiles
create policy "Agents can insert their agent_profiles"
  on public.agent_profiles
  as restrictive
  for insert
  with check (auth.uid() = user_id);

-- Agents can update their agent_profiles
create policy "Agents can update their agent_profiles"
  on public.agent_profiles
  as restrictive
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Agents can view their agent_profiles
create policy "Agents can view their agent_profiles"
  on public.agent_profiles
  as restrictive
  for select
  using (auth.uid() = user_id);


-- 2) Agent bank details
create table if not exists public.agent_bank_details (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account_number text not null,
  ifsc_code text not null,
  account_type text,
  pan_number text,
  upi_id text,
  micr_code text,
  account_holder_name text not null,
  bank_name text not null,
  branch_name text
);

alter table public.agent_bank_details enable row level security;

-- Admins can manage agent_bank_details
create policy "Admins can manage agent_bank_details"
  on public.agent_bank_details
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Agents can upsert their agent_bank_details
create policy "Agents can insert their agent_bank_details"
  on public.agent_bank_details
  as restrictive
  for insert
  with check (auth.uid() = agent_id);

create policy "Agents can update their agent_bank_details"
  on public.agent_bank_details
  as restrictive
  for update
  using (auth.uid() = agent_id)
  with check (auth.uid() = agent_id);

create policy "Agents can view their agent_bank_details"
  on public.agent_bank_details
  as restrictive
  for select
  using (auth.uid() = agent_id);

create policy "Agents can delete their agent_bank_details"
  on public.agent_bank_details
  as restrictive
  for delete
  using (auth.uid() = agent_id);


-- 3) Agent activity logs
create table if not exists public.agent_activity_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null,
  action text not null,
  actor_id uuid,
  actor_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agent_activity_logs enable row level security;

-- Admins can manage agent_activity_logs
create policy "Admins can manage agent_activity_logs"
  on public.agent_activity_logs
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Agents can view their agent_activity_logs
create policy "Agents can view their agent_activity_logs"
  on public.agent_activity_logs
  as restrictive
  for select
  using (auth.uid() = agent_id);

-- Logging function for agent activity
create or replace function public.log_agent_activity_fn(
  p_agent_id uuid,
  p_action text,
  p_actor_id uuid,
  p_actor_type text,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.agent_activity_logs(agent_id, action, actor_id, actor_type, metadata)
  values (p_agent_id, p_action, p_actor_id, p_actor_type, coalesce(p_metadata, '{}'::jsonb));
end;
$$;


-- 4) Agent payouts
create table if not exists public.agent_payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null,
  period_start date,
  period_end date,
  gross_revenue numeric not null default 0,
  commission_amount numeric not null default 0,
  payout_amount numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending'
);

alter table public.agent_payouts enable row level security;

-- Admins can manage agent_payouts
create policy "Admins can manage agent_payouts"
  on public.agent_payouts
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Agents can view their agent_payouts
create policy "Agents can view their agent_payouts"
  on public.agent_payouts
  as restrictive
  for select
  using (auth.uid() = agent_id);


-- 5) Agent property assignments
create table if not exists public.agent_property_assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null,
  property_id uuid not null,
  assigned_by uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(agent_id, property_id)
);

alter table public.agent_property_assignments enable row level security;

-- Admins can manage agent_property_assignments
create policy "Admins can manage agent_property_assignments"
  on public.agent_property_assignments
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Agents can view their assignments
create policy "Agents can view their own assignments"
  on public.agent_property_assignments
  as restrictive
  for select
  using (auth.uid() = agent_id);


-- 6) Log agent booking activity via trigger
create or replace function public.on_booking_insert_log_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.agent_id is not null then
    perform public.log_agent_activity_fn(
      new.agent_id,
      'booking_created',
      coalesce(new.agent_id, new.user_id),
      case when new.agent_id is not null then 'agent' else 'user' end,
      jsonb_build_object('booking_id', new.id, 'property_id', new.property_id, 'status', new.status, 'total_amount', new.total_amount)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_booking_insert_log_agent on public.bookings;
create trigger trg_on_booking_insert_log_agent
  after insert on public.bookings
  for each row execute procedure public.on_booking_insert_log_agent();


-- 7) Generic login activity table (for agents and others)
create table if not exists public.user_login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_role text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.user_login_activity enable row level security;

-- Admins can manage user_login_activity
create policy "Admins can manage user_login_activity"
  on public.user_login_activity
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Users can view their own login activity
create policy "Users can view their own login activity"
  on public.user_login_activity
  as restrictive
  for select
  using (auth.uid() = user_id);


-- 8) Storage: agent-logos (public) and agent-docs (private)
insert into storage.buckets (id, name, public)
values
  ('agent-logos', 'agent-logos', true),
  ('agent-docs', 'agent-docs', false)
on conflict (id) do nothing;

-- Policies for storage.objects (agent-logos)
-- Public read
create policy if not exists "Public read access to agent logos"
  on storage.objects
  for select
  using (bucket_id = 'agent-logos');

-- Agents can manage their own folder in agent-logos
create policy if not exists "Agents manage their own agent-logos folder"
  on storage.objects
  for all
  using (
    bucket_id = 'agent-logos'
    and (
      is_admin()
      or (auth.uid() is not null and (name like (auth.uid()::text || '/%')))
    )
  )
  with check (
    bucket_id = 'agent-logos'
    and (
      is_admin()
      or (auth.uid() is not null and (name like (auth.uid()::text || '/%')))
    )
  );

-- Policies for storage.objects (agent-docs)
-- Admin full access
create policy if not exists "Admins manage agent-docs"
  on storage.objects
  for all
  using (bucket_id = 'agent-docs' and is_admin())
  with check (bucket_id = 'agent-docs' and is_admin());

-- Agents manage their own folder
create policy if not exists "Agents manage their own agent-docs folder"
  on storage.objects
  for all
  using (
    bucket_id = 'agent-docs'
    and (
      is_admin()
      or (auth.uid() is not null and (name like (auth.uid()::text || '/%')))
    )
  )
  with check (
    bucket_id = 'agent-docs'
    and (
      is_admin()
      or (auth.uid() is not null and (name like (auth.uid()::text || '/%')))
    )
  );
