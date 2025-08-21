
-- Create table for flat meal prices per package (not per hour)
create table if not exists public.day_picnic_meal_prices (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.day_picnic_packages(id) on delete cascade,
  meal_plan text not null,
  price_per_person numeric not null default 0,
  price_per_package numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep timestamps updated
create trigger day_picnic_meal_prices_set_updated_at
before update on public.day_picnic_meal_prices
for each row execute procedure public.update_updated_at_column();

-- Index for performance on package lookups
create index if not exists idx_day_picnic_meal_prices_package_id
  on public.day_picnic_meal_prices (package_id);

-- Enable RLS
alter table public.day_picnic_meal_prices enable row level security;

-- Admins can manage all
create policy if not exists "Admins can manage all meal prices"
  on public.day_picnic_meal_prices
  as permissive
  for all
  using (is_admin())
  with check (is_admin());

-- Owners can view their meal prices
create policy if not exists "Owners can view their meal prices"
  on public.day_picnic_meal_prices
  as permissive
  for select
  using (
    exists (
      select 1
      from public.day_picnic_packages pkg
      join public.properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Owners can create their meal prices
create policy if not exists "Owners can create their meal prices"
  on public.day_picnic_meal_prices
  as permissive
  for insert
  with check (
    exists (
      select 1
      from public.day_picnic_packages pkg
      join public.properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Owners can update their meal prices
create policy if not exists "Owners can update their meal prices"
  on public.day_picnic_meal_prices
  as permissive
  for update
  using (
    exists (
      select 1
      from public.day_picnic_packages pkg
      join public.properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Owners can delete their meal prices
create policy if not exists "Owners can delete their meal prices"
  on public.day_picnic_meal_prices
  as permissive
  for delete
  using (
    exists (
      select 1
      from public.day_picnic_packages pkg
      join public.properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.owner_id = auth.uid()
    )
  );

-- Public can view meal prices for approved properties
create policy if not exists "Public can view meal prices for approved properties"
  on public.day_picnic_meal_prices
  as permissive
  for select
  using (
    exists (
      select 1
      from public.day_picnic_packages pkg
      join public.properties p on p.id = pkg.property_id
      where pkg.id = day_picnic_meal_prices.package_id
        and p.status = 'approved'
    )
  );
