
-- Create table for day picnic meal prices
create table if not exists public.day_picnic_meal_prices (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null,
  meal_plan text not null,
  price_per_person numeric not null default 0,
  price_per_package numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicates per (package_id, meal_plan)
create unique index if not exists day_picnic_meal_prices_pkg_meal_uidx
  on public.day_picnic_meal_prices (package_id, meal_plan);

-- Performance index for common filter
create index if not exists day_picnic_meal_prices_pkg_idx
  on public.day_picnic_meal_prices (package_id);

-- Enable RLS
alter table public.day_picnic_meal_prices enable row level security;

-- Admins can manage all
drop policy if exists "Admins can manage all meal prices" on public.day_picnic_meal_prices;
create policy "Admins can manage all meal prices"
  on public.day_picnic_meal_prices
  as restrictive
  for all
  using (is_admin())
  with check (is_admin());

-- Owners can insert their meal prices
drop policy if exists "Owners can create their meal prices" on public.day_picnic_meal_prices;
create policy "Owners can create their meal prices"
  on public.day_picnic_meal_prices
  as restrictive
  for insert
  with check (
    exists (
      select 1
      from day_picnic_packages pkg
      join properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Owners can update their meal prices
drop policy if exists "Owners can update their meal prices" on public.day_picnic_meal_prices;
create policy "Owners can update their meal prices"
  on public.day_picnic_meal_prices
  as restrictive
  for update
  using (
    exists (
      select 1
      from day_picnic_packages pkg
      join properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from day_picnic_packages pkg
      join properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Owners can delete their meal prices
drop policy if exists "Owners can delete their meal prices" on public.day_picnic_meal_prices;
create policy "Owners can delete their meal prices"
  on public.day_picnic_meal_prices
  as restrictive
  for delete
  using (
    exists (
      select 1
      from day_picnic_packages pkg
      join properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Owners can view their meal prices
drop policy if exists "Owners can view their meal prices" on public.day_picnic_meal_prices;
create policy "Owners can view their meal prices"
  on public.day_picnic_meal_prices
  as restrictive
  for select
  using (
    exists (
      select 1
      from day_picnic_packages pkg
      join properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Public can view meal prices for approved properties
drop policy if exists "Public can view meal prices for approved properties" on public.day_picnic_meal_prices;
create policy "Public can view meal prices for approved properties"
  on public.day_picnic_meal_prices
  as restrictive
  for select
  using (
    exists (
      select 1
      from day_picnic_packages pkg
      join properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.status = 'approved'
    )
  );
