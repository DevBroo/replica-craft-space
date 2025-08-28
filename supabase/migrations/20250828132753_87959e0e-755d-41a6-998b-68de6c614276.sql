
-- 1) Extend properties with missing fields
alter table public.properties
  add column if not exists video_url text,
  add column if not exists menu_available boolean not null default false,
  add column if not exists banquet_hall_capacity integer,
  add column if not exists ground_lawn_capacity integer,
  add column if not exists host_details jsonb not null default '{}'::jsonb,
  add column if not exists admin_blocked boolean not null default false;

-- 2) Status history table
create table if not exists public.property_status_history (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  comment text,
  actor_id uuid,
  actor_role text,
  created_at timestamptz not null default now()
);

alter table public.property_status_history enable row level security;

-- RLS: Admins can manage
create policy if not exists "Admins can manage property_status_history"
  on public.property_status_history
  as permissive
  for all
  using (is_admin())
  with check (is_admin());

-- RLS: Owners can view history for their properties
create policy if not exists "Owners can view status history for own properties"
  on public.property_status_history
  as permissive
  for select
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and p.owner_id = auth.uid()
    )
  );

-- 2a) RPC to update status with reason/comment and log
create or replace function public.log_property_status_change(
  p_property_id uuid,
  p_to_status text,
  p_reason text default null,
  p_comment text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
  v_actor_role text;
begin
  -- Only admins or property owners can change status; typically admin for this RPC
  if not (is_admin() or exists (select 1 from properties p where p.id = p_property_id and p.owner_id = auth.uid())) then
    raise exception 'Not authorized to change property status';
  end if;

  select status into v_old_status from public.properties where id = p_property_id for update;

  update public.properties
  set status = p_to_status,
      updated_at = now()
  where id = p_property_id;

  v_actor_role := case when is_admin() then 'admin' else 'owner' end;

  insert into public.property_status_history(
    property_id, from_status, to_status, reason, comment, actor_id, actor_role
  ) values (
    p_property_id, v_old_status, p_to_status, p_reason, p_comment, auth.uid(), v_actor_role
  );

  return true;
end;
$$;

-- 2b) Trigger to auto-log status changes (without reason/comment)
create or replace function public.on_property_status_change_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE') and (old.status is distinct from new.status) then
    insert into public.property_status_history(property_id, from_status, to_status, actor_id, actor_role)
    values (new.id, old.status, new.status, auth.uid(), case when is_admin() then 'admin' else 'owner' end);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_property_status_change_log on public.properties;
create trigger trg_property_status_change_log
after update of status on public.properties
for each row execute procedure public.on_property_status_change_log();

-- 3) Revisions table for resubmissions
create table if not exists public.property_revisions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null,
  revision_notes text,
  snapshot jsonb not null,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.property_revisions enable row level security;

-- RLS: Admins can manage
create policy if not exists "Admins can manage property_revisions"
  on public.property_revisions
  as permissive
  for all
  using (is_admin())
  with check (is_admin());

-- RLS: Owners can insert/select their revisions
create policy if not exists "Owners can insert their property_revisions"
  on public.property_revisions
  as permissive
  for insert
  with check (
    owner_id = auth.uid() and exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

create policy if not exists "Owners can view their property_revisions"
  on public.property_revisions
  as permissive
  for select
  using (
    owner_id = auth.uid()
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- Updated at trigger for revisions
drop trigger if exists trg_property_revisions_updated_at on public.property_revisions;
create trigger trg_property_revisions_updated_at
before update on public.property_revisions
for each row execute procedure public.update_updated_at_column();

-- Trigger to capture resubmission snapshot when property returns to pending
create or replace function public.on_property_resubmission_capture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE') and (new.status = 'pending') and (old.status is distinct from new.status) then
    insert into public.property_revisions(property_id, owner_id, revision_notes, snapshot, status)
    values (new.id, new.owner_id, 'Auto-captured on resubmission to pending', to_jsonb(new), 'submitted');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_property_resubmission_capture on public.properties;
create trigger trg_property_resubmission_capture
after update on public.properties
for each row execute procedure public.on_property_resubmission_capture();

-- 4) Property availability table
create table if not exists public.property_availability (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  day date not null,
  category text not null, -- 'rooms' | 'day_picnic' | 'banquet_hall' | 'ground_lawn'
  total_capacity integer,
  booked_units integer not null default 0,
  status text not null default 'available', -- 'available' | 'partial' | 'booked' | 'blocked'
  booking_name text,
  quantity integer, -- rooms booked or people count depending on category
  notes text,
  created_by uuid default auth.uid(),
  created_by_role text default (case when is_admin() then 'admin' else 'owner' end),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, day, category)
);

alter table public.property_availability enable row level security;

-- RLS: Admins can manage all availability
create policy if not exists "Admins can manage property_availability"
  on public.property_availability
  as permissive
  for all
  using (is_admin())
  with check (is_admin());

-- RLS: Owners can manage availability of their properties
create policy if not exists "Owners can manage their property_availability"
  on public.property_availability
  as permissive
  for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- Updated at trigger
drop trigger if exists trg_property_availability_updated_at on public.property_availability;
create trigger trg_property_availability_updated_at
before update on public.property_availability
for each row execute procedure public.update_updated_at_column();

-- Useful index
create index if not exists idx_property_availability_property_date
  on public.property_availability(property_id, day);

-- 5) Admin analytics for approval workflow
create or replace function public.get_property_approval_stats()
returns table(
  total_pending bigint,
  total_approved bigint,
  total_rejected bigint,
  avg_pending_hours numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with t as (
    select 
      p.*,
      (select max(psh.created_at) 
         from public.property_status_history psh
         where psh.property_id = p.id 
           and psh.to_status = 'pending') as last_pending_at
    from public.properties p
  )
  select
    (select count(*) from public.properties where status = 'pending')::bigint as total_pending,
    (select count(*) from public.properties where status = 'approved')::bigint as total_approved,
    (select count(*) from public.properties where status = 'rejected')::bigint as total_rejected,
    coalesce(avg(extract(epoch from (now() - last_pending_at)) / 3600.0), 0)::numeric as avg_pending_hours
  from t
  where t.status = 'pending';
end;
$$;
