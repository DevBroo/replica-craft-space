
-- 1) Table: day_picnic_packages
create table if not exists public.day_picnic_packages (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  meal_plan text[] not null default array[]::text[],
  start_time time not null,
  end_time time not null,
  duration_hours integer not null default 0,
  pricing_type text not null default 'per_person',
  base_price numeric not null default 0,
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint day_picnic_pricing_type_chk check (pricing_type in ('per_person','per_package'))
);

-- One package per property (adjust to remove if you want multiple packages)
alter table public.day_picnic_packages
  add constraint day_picnic_property_unique unique (property_id);

-- Helpful index
create index if not exists day_picnic_property_id_idx on public.day_picnic_packages (property_id);

-- Trigger to maintain updated_at
drop trigger if exists day_picnic_set_updated_at on public.day_picnic_packages;
create trigger day_picnic_set_updated_at
before update on public.day_picnic_packages
for each row
execute function public.update_updated_at_column();

-- 2) Row Level Security
alter table public.day_picnic_packages enable row level security;

-- Admin full access
drop policy if exists "Admins can manage all day picnic packages" on public.day_picnic_packages;
create policy "Admins can manage all day picnic packages"
on public.day_picnic_packages
for all
using (public.is_admin())
with check (public.is_admin());

-- Owners can view their own packages
drop policy if exists "Owners can view their day picnic packages" on public.day_picnic_packages;
create policy "Owners can view their day picnic packages"
on public.day_picnic_packages
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = day_picnic_packages.property_id
      and p.owner_id = auth.uid()
  )
);

-- Owners can create packages for their own properties
drop policy if exists "Owners can create day picnic packages" on public.day_picnic_packages;
create policy "Owners can create day picnic packages"
on public.day_picnic_packages
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = day_picnic_packages.property_id
      and p.owner_id = auth.uid()
  )
);

-- Owners can update their own packages
drop policy if exists "Owners can update their day picnic packages" on public.day_picnic_packages;
create policy "Owners can update their day picnic packages"
on public.day_picnic_packages
for update
using (
  exists (
    select 1
    from public.properties p
    where p.id = day_picnic_packages.property_id
      and p.owner_id = auth.uid()
  )
);

-- Owners can delete their own packages
drop policy if exists "Owners can delete their day picnic packages" on public.day_picnic_packages;
create policy "Owners can delete their day picnic packages"
on public.day_picnic_packages
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = day_picnic_packages.property_id
      and p.owner_id = auth.uid()
  )
);

-- Public can view only packages for approved properties
drop policy if exists "Public can view day picnic packages for approved properties" on public.day_picnic_packages;
create policy "Public can view day picnic packages for approved properties"
on public.day_picnic_packages
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = day_picnic_packages.property_id
      and p.status = 'approved'
  )
);
