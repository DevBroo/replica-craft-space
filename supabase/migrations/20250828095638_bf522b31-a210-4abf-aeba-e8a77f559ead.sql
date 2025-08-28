
-- 1) Time Series Analytics (Daily / Weekly / Monthly) with filters
create or replace function public.get_time_series_analytics(
  start_date date default (current_date - '30 days'::interval),
  end_date date default current_date,
  granularity text default 'day',
  owner_id uuid default null,
  agent_id uuid default null,
  property_type text default null
)
returns table(
  period timestamptz,
  total_bookings bigint,
  total_revenue numeric,
  average_booking_value numeric,
  bookings_by_status jsonb,
  payments_by_status jsonb,
  refunds_total numeric,
  cancellations bigint
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  gran text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  gran := case 
    when lower(granularity) in ('day','week','month','quarter','year') then lower(granularity)
    else 'day'
  end;

  return query
  with scoped as (
    select 
      b.*,
      p.owner_id as p_owner_id,
      p.property_type as p_property_type
    from public.bookings b
    left join public.properties p on p.id = b.property_id
    where b.created_at::date between start_date and end_date
      and (owner_id is null or p.owner_id = owner_id)
      and (agent_id is null or b.agent_id = agent_id)
      and (property_type is null or p.property_type = property_type)
  ),
  grouped as (
    select
      date_trunc(gran, s.created_at) as period,
      count(*)::bigint as total_bookings,
      coalesce(sum(case when s.status = 'confirmed' then s.total_amount else 0 end), 0) as total_revenue,
      coalesce(avg(s.total_amount), 0) as average_booking_value,
      (
        select json_object_agg(st, cnt)
        from (
          select coalesce(status, 'unknown') as st, count(*) as cnt
          from scoped s2
          where date_trunc(gran, s2.created_at) = date_trunc(gran, s.created_at)
          group by st
        ) t
      )::jsonb as bookings_by_status,
      (
        select json_object_agg(coalesce(payment_status,'unknown'), cnt)
        from (
          select payment_status, count(*) as cnt
          from scoped s3
          where date_trunc(gran, s3.created_at) = date_trunc(gran, s.created_at)
          group by payment_status
        ) t2
      )::jsonb as payments_by_status,
      coalesce(sum(s.refund_amount), 0) as refunds_total,
      coalesce(sum(case when s.status ilike 'cancel%%' then 1 else 0 end), 0)::bigint as cancellations
    from scoped s
    group by 1
    order by 1
  )
  select * from grouped;
end;
$$;

-- 2) Revenue by Property (sortable + paginated)
create or replace function public.get_revenue_by_property(
  start_date date default (current_date - '30 days'::interval),
  end_date date default current_date,
  owner_filter uuid default null,
  agent_filter uuid default null,
  property_type_filter text default null,
  limit_count int default 50,
  offset_count int default 0,
  sort_by text default 'revenue',   -- revenue | bookings | cancellations
  sort_dir text default 'desc'      -- asc | desc
)
returns table(
  property_id uuid,
  property_title text,
  owner_id uuid,
  owner_name text,
  revenue numeric,
  bookings_count bigint,
  cancellations bigint,
  refunds_total numeric
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select 
      b.*,
      p.title,
      p.owner_id as p_owner_id,
      pr.full_name as owner_name
    from public.bookings b
    join public.properties p on p.id = b.property_id
    left join public.profiles pr on pr.id = p.owner_id
    where b.created_at::date between start_date and end_date
      and (owner_filter is null or p.owner_id = owner_filter)
      and (agent_filter is null or b.agent_id = agent_filter)
      and (property_type_filter is null or p.property_type = property_type_filter)
  ),
  agg as (
    select
      property_id,
      max(title) as property_title,
      max(p_owner_id) as owner_id,
      max(owner_name) as owner_name,
      coalesce(sum(case when status = 'confirmed' then total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(refund_amount), 0) as refunds_total
    from scoped
    group by property_id
  )
  select *
  from agg
  order by
    case when lower(sort_by)='revenue' and lower(sort_dir)='asc' then revenue end asc,
    case when lower(sort_by)='revenue' and lower(sort_dir)='desc' then revenue end desc,
    case when lower(sort_by)='bookings' and lower(sort_dir)='asc' then bookings_count end asc,
    case when lower(sort_by)='bookings' and lower(sort_dir)='desc' then bookings_count end desc,
    case when lower(sort_by)='cancellations' and lower(sort_dir)='asc' then cancellations end asc,
    case when lower(sort_by)='cancellations' and lower(sort_dir)='desc' then cancellations end desc,
    property_title asc
  limit limit_count offset offset_count;
end;
$$;

-- 3) Revenue by Owner (sortable + paginated)
create or replace function public.get_revenue_by_owner(
  start_date date default (current_date - '30 days'::interval),
  end_date date default current_date,
  agent_filter uuid default null,
  property_type_filter text default null,
  limit_count int default 50,
  offset_count int default 0,
  sort_by text default 'revenue',  -- revenue | bookings | cancellations
  sort_dir text default 'desc'     -- asc | desc
)
returns table(
  owner_id uuid,
  owner_name text,
  revenue numeric,
  bookings_count bigint,
  cancellations bigint,
  refunds_total numeric
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select 
      b.*,
      p.owner_id,
      pr.full_name as owner_name,
      p.property_type
    from public.bookings b
    join public.properties p on p.id = b.property_id
    left join public.profiles pr on pr.id = p.owner_id
    where b.created_at::date between start_date and end_date
      and (agent_filter is null or b.agent_id = agent_filter)
      and (property_type_filter is null or p.property_type = property_type_filter)
  ),
  agg as (
    select
      owner_id,
      max(owner_name) as owner_name,
      coalesce(sum(case when status = 'confirmed' then total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(refund_amount), 0) as refunds_total
    from scoped
    group by owner_id
  )
  select *
  from agg
  order by
    case when lower(sort_by)='revenue' and lower(sort_dir)='asc' then revenue end asc,
    case when lower(sort_by)='revenue' and lower(sort_dir)='desc' then revenue end desc,
    case when lower(sort_by)='bookings' and lower(sort_dir)='asc' then bookings_count end asc,
    case when lower(sort_by)='bookings' and lower(sort_dir)='desc' then bookings_count end desc,
    case when lower(sort_by)='cancellations' and lower(sort_dir)='asc' then cancellations end asc,
    case when lower(sort_by)='cancellations' and lower(sort_dir)='desc' then cancellations end desc,
    owner_name asc
  limit limit_count offset offset_count;
end;
$$;

-- 4) Revenue by Agent (sortable + paginated)
create or replace function public.get_revenue_by_agent(
  start_date date default (current_date - '30 days'::interval),
  end_date date default current_date,
  owner_filter uuid default null,
  property_type_filter text default null,
  limit_count int default 50,
  offset_count int default 0,
  sort_by text default 'revenue',  -- revenue | bookings | cancellations
  sort_dir text default 'desc'     -- asc | desc
)
returns table(
  agent_id uuid,
  agent_name text,
  revenue numeric,
  bookings_count bigint,
  cancellations bigint,
  refunds_total numeric
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select 
      b.*,
      a.full_name as agent_name,
      p.owner_id,
      p.property_type
    from public.bookings b
    left join public.profiles a on a.id = b.agent_id
    left join public.properties p on p.id = b.property_id
    where b.created_at::date between start_date and end_date
      and (owner_filter is null or p.owner_id = owner_filter)
      and (property_type_filter is null or p.property_type = property_type_filter)
  ),
  agg as (
    select
      agent_id,
      max(agent_name) as agent_name,
      coalesce(sum(case when status = 'confirmed' then total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(refund_amount), 0) as refunds_total
    from scoped
    where agent_id is not null
    group by agent_id
  )
  select *
  from agg
  order by
    case when lower(sort_by)='revenue' and lower(sort_dir)='asc' then revenue end asc,
    case when lower(sort_by)='revenue' and lower(sort_dir)='desc' then revenue end desc,
    case when lower(sort_by)='bookings' and lower(sort_dir)='asc' then bookings_count end asc,
    case when lower(sort_by)='bookings' and lower(sort_dir)='desc' then bookings_count end desc,
    case when lower(sort_by)='cancellations' and lower(sort_dir)='asc' then cancellations end asc,
    case when lower(sort_by)='cancellations' and lower(sort_dir)='desc' then cancellations end desc,
    agent_name asc
  limit limit_count offset offset_count;
end;
$$;

-- 5) Most Booked Properties (Top N by bookings within date range)
create or replace function public.get_top_properties(
  start_date date default (current_date - '30 days'::interval),
  end_date date default current_date,
  limit_count int default 10
)
returns table(
  property_id uuid,
  property_title text,
  bookings_count bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select b.*, p.title
    from public.bookings b
    join public.properties p on p.id = b.property_id
    where b.created_at::date between start_date and end_date
  ),
  agg as (
    select
      property_id,
      max(title) as property_title,
      count(*)::bigint as bookings_count,
      coalesce(sum(case when status = 'confirmed' then total_amount else 0 end), 0) as revenue
    from scoped
    group by property_id
  )
  select * from agg
  order by bookings_count desc, revenue desc, property_title asc
  limit limit_count;
end;
$$;

-- 6) Highest Rated Properties (Top N by rating, require minimum reviews)
create or replace function public.get_highest_rated_properties(
  limit_count int default 10,
  min_reviews int default 5
)
returns table(
  property_id uuid,
  property_title text,
  rating numeric,
  review_count integer
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    id as property_id,
    title as property_title,
    coalesce(rating, 0) as rating,
    coalesce(review_count, 0) as review_count
  from public.properties
  where status = 'approved'
    and coalesce(review_count, 0) >= min_reviews
  order by rating desc, review_count desc, title asc
  limit limit_count;
end;
$$;
