
-- 1) OWNER PROFILES: Compliance and business details
create table if not exists public.owner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text,
  logo_url text,
  gst_number text,
  pan_number text,
  aadhar_number text,
  office_address jsonb default jsonb_build_object(
    'line1', null,
    'line2', null,
    'city', null,
    'state', null,
    'postal_code', null
  ),
  is_office_same_as_property boolean default false not null,
  property_types_offered text[] default '{}',
  property_count integer default 0 not null,
  documents jsonb default '{}'::jsonb, -- optional additional mapping if needed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.owner_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_profiles' and policyname='Admins can manage owner_profiles'
  ) then
    create policy "Admins can manage owner_profiles"
      on public.owner_profiles
      as restrictive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_profiles' and policyname='Owners can view their owner_profiles'
  ) then
    create policy "Owners can view their owner_profiles"
      on public.owner_profiles
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_profiles' and policyname='Owners can insert their owner_profiles'
  ) then
    create policy "Owners can insert their owner_profiles"
      on public.owner_profiles
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_profiles' and policyname='Owners can update their owner_profiles'
  ) then
    create policy "Owners can update their owner_profiles"
      on public.owner_profiles
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 2) OWNER BANK DETAILS (1:1)
create table if not exists public.owner_bank_details (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  account_holder_name text not null,
  bank_name text not null,
  branch_name text,
  account_number text not null,
  ifsc_code text not null,
  account_type text,
  pan_number text,
  upi_id text,
  micr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id)
);

create index if not exists idx_owner_bank_details_owner_id on public.owner_bank_details(owner_id);

alter table public.owner_bank_details enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_bank_details' and policyname='Admins can manage owner_bank_details'
  ) then
    create policy "Admins can manage owner_bank_details"
      on public.owner_bank_details
      as restrictive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_bank_details' and policyname='Owners can view their owner_bank_details'
  ) then
    create policy "Owners can view their owner_bank_details"
      on public.owner_bank_details
      for select
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_bank_details' and policyname='Owners can upsert their owner_bank_details'
  ) then
    create policy "Owners can upsert their owner_bank_details"
      on public.owner_bank_details
      for insert
      with check (auth.uid() = owner_id);
    create policy "Owners can update their owner_bank_details"
      on public.owner_bank_details
      for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
end $$;

-- 3) OWNER ACTIVITY LOGS
create table if not exists public.owner_activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  action text not null, -- e.g. 'login', 'property_submitted', 'booking_created', 'status_changed', 'notification_sent'
  actor_id uuid,        -- who performed the action (admin/owner/user/agent)
  actor_type text,      -- 'admin' | 'owner' | 'user' | 'agent' | 'system'
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_owner_activity_logs_owner_id on public.owner_activity_logs(owner_id);
create index if not exists idx_owner_activity_logs_created_at on public.owner_activity_logs(created_at);

alter table public.owner_activity_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_activity_logs' and policyname='Admins can manage owner_activity_logs'
  ) then
    create policy "Admins can manage owner_activity_logs"
      on public.owner_activity_logs
      as restrictive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_activity_logs' and policyname='Owners can view their owner_activity_logs'
  ) then
    create policy "Owners can view their owner_activity_logs"
      on public.owner_activity_logs
      for select
      using (auth.uid() = owner_id);
  end if;
end $$;

-- 4) OWNER PAYOUTS (to record disbursed commissions to owners)
create table if not exists public.owner_payouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  period_start date,
  period_end date,
  gross_revenue numeric not null default 0,
  commission_amount numeric not null default 0,
  payout_amount numeric not null default 0, -- amount paid to owner
  status text not null default 'pending', -- pending | paid | failed | canceled
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_owner_payouts_owner_id on public.owner_payouts(owner_id);

alter table public.owner_payouts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_payouts' and policyname='Admins can manage owner_payouts'
  ) then
    create policy "Admins can manage owner_payouts"
      on public.owner_payouts
      as restrictive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='owner_payouts' and policyname='Owners can view their owner_payouts'
  ) then
    create policy "Owners can view their owner_payouts"
      on public.owner_payouts
      for select
      using (auth.uid() = owner_id);
  end if;
end $$;

-- 5) TRIGGERS: Keep property_count updated
create or replace function public.update_owner_property_count_fn(p_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.owner_profiles op
  set property_count = (
    select count(*) from public.properties p where p.owner_id = p_owner_id
  ),
  updated_at = now()
  where op.user_id = p_owner_id;
end;
$$;

create or replace function public.on_property_change_update_owner_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_owner uuid;
  new_owner uuid;
begin
  if tg_op = 'INSERT' then
    perform public.update_owner_property_count_fn(new.owner_id);
  elsif tg_op = 'DELETE' then
    perform public.update_owner_property_count_fn(old.owner_id);
  else
    old_owner := old.owner_id;
    new_owner := new.owner_id;
    if old_owner is distinct from new_owner then
      perform public.update_owner_property_count_fn(old_owner);
      perform public.update_owner_property_count_fn(new_owner);
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_properties_update_owner_count on public.properties;
create trigger trg_properties_update_owner_count
after insert or update of owner_id or delete on public.properties
for each row execute function public.on_property_change_update_owner_count();

-- 6) TRIGGERS: Activity logging for property submissions and bookings
create or replace function public.log_owner_activity_fn(p_owner_id uuid, p_action text, p_actor_id uuid, p_actor_type text, p_metadata jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.owner_activity_logs(owner_id, action, actor_id, actor_type, metadata)
  values (p_owner_id, p_action, p_actor_id, p_actor_type, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.on_property_insert_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_owner_activity_fn(
    new.owner_id,
    'property_submitted',
    new.owner_id,
    'owner',
    jsonb_build_object('property_id', new.id, 'title', new.title, 'status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists trg_properties_activity_log on public.properties;
create trigger trg_properties_activity_log
after insert on public.properties
for each row execute function public.on_property_insert_log();

create or replace function public.on_booking_insert_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select p.owner_id into v_owner from public.properties p where p.id = new.property_id;
  if v_owner is not null then
    perform public.log_owner_activity_fn(
      v_owner,
      'booking_created',
      coalesce(new.agent_id, new.user_id),
      case 
        when new.agent_id is not null then 'agent'
        else 'user'
      end,
      jsonb_build_object('booking_id', new.id, 'property_id', new.property_id, 'status', new.status, 'total_amount', new.total_amount)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bookings_activity_log on public.bookings;
create trigger trg_bookings_activity_log
after insert on public.bookings
for each row execute function public.on_booking_insert_log();

-- 7) STORAGE BUCKETS (owner-docs private, owner-logos public)
do $$
begin
  begin
    insert into storage.buckets (id, name, public) values ('owner-docs', 'owner-docs', false);
  exception
    when unique_violation then null;
  end;

  begin
    insert into storage.buckets (id, name, public) values ('owner-logos', 'owner-logos', true);
  exception
    when unique_violation then null;
  end;
end $$;

-- Storage policies for owner-docs (private)
-- Owners can manage only their folder: path '{user_id}/...'
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Admins can manage owner-docs'
  ) then
    create policy "Admins can manage owner-docs"
      on storage.objects
      as restrictive
      for all
      using (bucket_id = 'owner-docs' and public.is_admin())
      with check (bucket_id = 'owner-docs' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Owners can read their owner-docs'
  ) then
    create policy "Owners can read their owner-docs"
      on storage.objects
      for select
      using (
        bucket_id = 'owner-docs'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Owners can write their owner-docs'
  ) then
    create policy "Owners can write their owner-docs"
      on storage.objects
      for insert
      with check (
        bucket_id = 'owner-docs'
        and split_part(name, '/', 1) = auth.uid()::text
      );

    create policy "Owners can update their owner-docs"
      on storage.objects
      for update
      using (
        bucket_id = 'owner-docs'
        and split_part(name, '/', 1) = auth.uid()::text
      )
      with check (
        bucket_id = 'owner-docs'
        and split_part(name, '/', 1) = auth.uid()::text
      );

    create policy "Owners can delete their owner-docs"
      on storage.objects
      for delete
      using (
        bucket_id = 'owner-docs'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

-- Storage policies for owner-logos (public read; owners/admins write)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public can read owner-logos'
  ) then
    create policy "Public can read owner-logos"
      on storage.objects
      for select
      using (bucket_id = 'owner-logos');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Admins can manage owner-logos'
  ) then
    create policy "Admins can manage owner-logos"
      on storage.objects
      as restrictive
      for all
      using (bucket_id = 'owner-logos' and public.is_admin())
      with check (bucket_id = 'owner-logos' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Owners can write owner-logos'
  ) then
    create policy "Owners can write owner-logos"
      on storage.objects
      for insert
      with check (
        bucket_id = 'owner-logos'
        and split_part(name, '/', 1) = auth.uid()::text
      );

    create policy "Owners can update owner-logos"
      on storage.objects
      for update
      using (
        bucket_id = 'owner-logos'
        and split_part(name, '/', 1) = auth.uid()::text
      )
      with check (
        bucket_id = 'owner-logos'
        and split_part(name, '/', 1) = auth.uid()::text
      );

    create policy "Owners can delete owner-logos"
      on storage.objects
      for delete
      using (
        bucket_id = 'owner-logos'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

-- 8) Helpful partial indexes (optional but useful for performance)
create index if not exists idx_properties_owner_pending on public.properties(owner_id) where status = 'pending';
