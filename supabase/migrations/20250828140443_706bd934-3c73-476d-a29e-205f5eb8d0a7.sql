
-- 1) Add missing properties columns expected by the UI
alter table public.properties
  add column if not exists menu_available boolean not null default false,
  add column if not exists admin_blocked boolean not null default false,
  add column if not exists host_details jsonb not null default '{}'::jsonb,
  add column if not exists video_url text,
  add column if not exists banquet_hall_capacity integer,
  add column if not exists ground_lawn_capacity integer;

-- Ensure properties.updated_at is maintained automatically
do $$
begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'trg_properties_set_updated_at'
  ) then
    create trigger trg_properties_set_updated_at
    before update on public.properties
    for each row execute function public.update_updated_at_column();
  end if;
end$$;

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

-- Indexes for faster lookups
create index if not exists idx_psh_property_id on public.property_status_history(property_id);
create index if not exists idx_psh_created_at on public.property_status_history(created_at);

-- RLS: Admins can manage all history
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where polname = 'Admins can manage property_status_history'
      and tablename = 'property_status_history'
  ) then
    create policy "Admins can manage property_status_history"
      on public.property_status_history
      as permissive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RLS: Owners can view history of their properties
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where polname = 'Owners can view property status history'
      and tablename = 'property_status_history'
  ) then
    create policy "Owners can view property status history"
      on public.property_status_history
      as permissive
      for select
      using (
        exists (
          select 1
          from public.properties p
          where p.id = property_status_history.property_id
            and p.owner_id = auth.uid()
        )
      );
  end if;
end$$;

-- RPC to change status with reason/comment and notify owner
create or replace function public.log_property_status_change(
  p_property_id uuid,
  p_to_status text,
  p_reason text default null,
  p_comment text default null
)
returns boolean
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_from_status text;
  v_owner_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select status, owner_id
  into v_from_status, v_owner_id
  from public.properties
  where id = p_property_id
  for update;

  if not found then
    raise exception 'Property not found';
  end if;

  -- Update property status
  update public.properties
  set status = p_to_status,
      updated_at = now()
  where id = p_property_id;

  -- Log status change with reason/comment
  insert into public.property_status_history(
    property_id, from_status, to_status, reason, comment, actor_id, actor_role
  )
  values (
    p_property_id, v_from_status, p_to_status, p_reason, p_comment, auth.uid(), 'admin'
  );

  -- Notify owner (best-effort)
  insert into public.notifications(
    target_user_id, related_entity_id, title, content, type, priority, status, related_entity_type
  )
  values (
    v_owner_id,
    p_property_id,
    case when lower(p_to_status) = 'approved' then 'Property Approved'
         when lower(p_to_status) = 'rejected' then 'Property Rejected'
         else 'Property Status Updated' end,
    coalesce(p_comment, 'Your property status has been updated to '||p_to_status),
    'info',
    'normal',
    'unread',
    'property'
  )
  on conflict do nothing;

  return true;
end;
$$;

-- 3) Availability table used by the calendar UI
create table if not exists public.property_availability (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  day date not null,
  category text not null check (category in ('rooms','day_picnic','banquet_hall','ground_lawn')),
  total_capacity integer not null default 0,
  booked_units integer not null default 0,
  status text not null default 'available' check (status in ('available','partial','booked','blocked')),
  booking_name text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, category, day)
);

alter table public.property_availability enable row level security;

-- Index for range queries
create index if not exists idx_property_availability_lookup
  on public.property_availability(property_id, category, day);

-- Validation trigger to keep capacities sane
create or replace function public.validate_property_availability()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.total_capacity < 0 or new.booked_units < 0 then
    raise exception 'Capacities cannot be negative';
  end if;

  if new.category = 'banquet_hall' then
    if coalesce(new.total_capacity, 0) = 0 then
      new.total_capacity := 1;
    end if;
  end if;

  if new.booked_units > new.total_capacity then
    raise exception 'Booked units (%) cannot exceed total capacity (%)', new.booked_units, new.total_capacity;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_property_availability_validate'
  ) then
    create trigger trg_property_availability_validate
    before insert or update on public.property_availability
    for each row execute function public.validate_property_availability();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_property_availability_set_updated_at'
  ) then
    create trigger trg_property_availability_set_updated_at
    before update on public.property_availability
    for each row execute function public.update_updated_at_column();
  end if;
end$$;

-- RLS: Admins manage all
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where polname = 'Admins can manage property_availability'
      and tablename = 'property_availability'
  ) then
    create policy "Admins can manage property_availability"
      on public.property_availability
      as permissive
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RLS: Owners can view entries for their properties
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where polname = 'Owners can view property_availability'
      and tablename = 'property_availability'
  ) then
    create policy "Owners can view property_availability"
      on public.property_availability
      as permissive
      for select
      using (
        exists (
          select 1
          from public.properties p
          where p.id = property_availability.property_id
            and p.owner_id = auth.uid()
        )
      );
  end if;
end$$;

-- RLS: Owners can insert/update/delete for their properties
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where polname = 'Owners can modify property_availability'
      and tablename = 'property_availability'
  ) then
    create policy "Owners can modify property_availability"
      on public.property_availability
      as permissive
      for insert
      with check (
        exists (
          select 1
          from public.properties p
          where p.id = property_availability.property_id
            and p.owner_id = auth.uid()
        )
      );
    create policy "Owners can update property_availability"
      on public.property_availability
      as permissive
      for update
      using (
        exists (
          select 1
          from public.properties p
          where p.id = property_availability.property_id
            and p.owner_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.properties p
          where p.id = property_availability.property_id
            and p.owner_id = auth.uid()
        )
      );
    create policy "Owners can delete property_availability"
      on public.property_availability
      as permissive
      for delete
      using (
        exists (
          select 1
          from public.properties p
          where p.id = property_availability.property_id
            and p.owner_id = auth.uid()
        )
      );
  end if;
end$$;

-- 4) Admin insights function for pending/approved/rejected and average pending time
create or replace function public.get_property_approval_stats()
returns table(
  total_pending bigint,
  total_approved bigint,
  total_rejected bigint,
  avg_pending_hours numeric
)
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    count(*) filter (where status = 'pending')::bigint as total_pending,
    count(*) filter (where status = 'approved')::bigint as total_approved,
    count(*) filter (where status = 'rejected')::bigint as total_rejected,
    coalesce(
      round(
        (extract(epoch from avg(now() - created_at)) / 3600)::numeric
      , 2),
      0
    ) as avg_pending_hours
  from public.properties;
end;
$$;
