-- Drop existing functions and recreate with fixed parameter names to resolve ambiguity

-- Drop functions first
DROP FUNCTION IF EXISTS public.get_time_series_analytics(date, date, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_revenue_by_property(date, date, uuid, uuid, text, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.get_revenue_by_owner(date, date, uuid, text, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.get_revenue_by_agent(date, date, uuid, text, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.get_top_properties(date, date, integer);
DROP FUNCTION IF EXISTS public.get_highest_rated_properties(integer, integer);

-- Recreate get_time_series_analytics function with unique parameter names
CREATE OR REPLACE FUNCTION public.get_time_series_analytics(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), 
  end_date date DEFAULT CURRENT_DATE, 
  granularity text DEFAULT 'day'::text, 
  filter_owner_id uuid DEFAULT NULL::uuid, 
  filter_agent_id uuid DEFAULT NULL::uuid, 
  filter_property_type text DEFAULT NULL::text
)
RETURNS TABLE(
  period timestamp with time zone, 
  total_bookings bigint, 
  total_revenue numeric, 
  average_booking_value numeric, 
  bookings_by_status jsonb, 
  payments_by_status jsonb, 
  refunds_total numeric, 
  cancellations bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      and (filter_owner_id is null or p.owner_id = filter_owner_id)
      and (filter_agent_id is null or b.agent_id = filter_agent_id)
      and (filter_property_type is null or p.property_type = filter_property_type)
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
$function$;

-- Recreate get_revenue_by_property function with unique parameter names
CREATE OR REPLACE FUNCTION public.get_revenue_by_property(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), 
  end_date date DEFAULT CURRENT_DATE, 
  filter_owner_id uuid DEFAULT NULL::uuid, 
  filter_agent_id uuid DEFAULT NULL::uuid, 
  filter_property_type text DEFAULT NULL::text, 
  limit_count integer DEFAULT 50, 
  offset_count integer DEFAULT 0, 
  sort_by text DEFAULT 'revenue'::text, 
  sort_dir text DEFAULT 'desc'::text
)
RETURNS TABLE(
  property_id uuid, 
  property_title text, 
  owner_id uuid, 
  owner_name text, 
  revenue numeric, 
  bookings_count bigint, 
  cancellations bigint, 
  refunds_total numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      and (filter_owner_id is null or p.owner_id = filter_owner_id)
      and (filter_agent_id is null or b.agent_id = filter_agent_id)
      and (filter_property_type is null or p.property_type = filter_property_type)
  ),
  agg as (
    select
      s.property_id,
      max(s.title) as property_title,
      max(s.p_owner_id) as owner_id,
      max(s.owner_name) as owner_name,
      coalesce(sum(case when s.status = 'confirmed' then s.total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when s.status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(s.refund_amount), 0) as refunds_total
    from scoped s
    group by s.property_id
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
$function$;

-- Recreate get_revenue_by_owner function with unique parameter names
CREATE OR REPLACE FUNCTION public.get_revenue_by_owner(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), 
  end_date date DEFAULT CURRENT_DATE, 
  filter_agent_id uuid DEFAULT NULL::uuid, 
  filter_property_type text DEFAULT NULL::text, 
  limit_count integer DEFAULT 50, 
  offset_count integer DEFAULT 0, 
  sort_by text DEFAULT 'revenue'::text, 
  sort_dir text DEFAULT 'desc'::text
)
RETURNS TABLE(
  owner_id uuid, 
  owner_name text, 
  revenue numeric, 
  bookings_count bigint, 
  cancellations bigint, 
  refunds_total numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select 
      b.*,
      p.owner_id as p_owner_id,
      pr.full_name as owner_name,
      p.property_type
    from public.bookings b
    join public.properties p on p.id = b.property_id
    left join public.profiles pr on pr.id = p.owner_id
    where b.created_at::date between start_date and end_date
      and (filter_agent_id is null or b.agent_id = filter_agent_id)
      and (filter_property_type is null or p.property_type = filter_property_type)
  ),
  agg as (
    select
      s.p_owner_id as owner_id,
      max(s.owner_name) as owner_name,
      coalesce(sum(case when s.status = 'confirmed' then s.total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when s.status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(s.refund_amount), 0) as refunds_total
    from scoped s
    group by s.p_owner_id
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
$function$;

-- Recreate get_revenue_by_agent function with unique parameter names
CREATE OR REPLACE FUNCTION public.get_revenue_by_agent(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), 
  end_date date DEFAULT CURRENT_DATE, 
  filter_owner_id uuid DEFAULT NULL::uuid, 
  filter_property_type text DEFAULT NULL::text, 
  limit_count integer DEFAULT 50, 
  offset_count integer DEFAULT 0, 
  sort_by text DEFAULT 'revenue'::text, 
  sort_dir text DEFAULT 'desc'::text
)
RETURNS TABLE(
  agent_id uuid, 
  agent_name text, 
  revenue numeric, 
  bookings_count bigint, 
  cancellations bigint, 
  refunds_total numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select 
      b.*,
      a.full_name as agent_name,
      p.owner_id as p_owner_id,
      p.property_type
    from public.bookings b
    left join public.profiles a on a.id = b.agent_id
    left join public.properties p on p.id = b.property_id
    where b.created_at::date between start_date and end_date
      and (filter_owner_id is null or p.owner_id = filter_owner_id)
      and (filter_property_type is null or p.property_type = filter_property_type)
  ),
  agg as (
    select
      s.agent_id,
      max(s.agent_name) as agent_name,
      coalesce(sum(case when s.status = 'confirmed' then s.total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when s.status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(s.refund_amount), 0) as refunds_total
    from scoped s
    where s.agent_id is not null
    group by s.agent_id
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
$function$;

-- Recreate get_top_properties function  
CREATE OR REPLACE FUNCTION public.get_top_properties(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), 
  end_date date DEFAULT CURRENT_DATE, 
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  property_id uuid, 
  property_title text, 
  bookings_count bigint, 
  revenue numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with scoped as (
    select b.*, p.title as p_title
    from public.bookings b
    join public.properties p on p.id = b.property_id
    where b.created_at::date between start_date and end_date
  ),
  agg as (
    select
      s.property_id,
      max(s.p_title) as property_title,
      count(*)::bigint as bookings_count,
      coalesce(sum(case when s.status = 'confirmed' then s.total_amount else 0 end), 0) as revenue
    from scoped s
    group by s.property_id
  )
  select * from agg
  order by bookings_count desc, revenue desc, property_title asc
  limit limit_count;
end;
$function$;

-- Recreate get_highest_rated_properties function
CREATE OR REPLACE FUNCTION public.get_highest_rated_properties(
  limit_count integer DEFAULT 10, 
  min_reviews integer DEFAULT 5
)
RETURNS TABLE(
  property_id uuid, 
  property_title text, 
  rating numeric, 
  review_count integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    p.id as property_id,
    p.title as property_title,
    coalesce(p.rating, 0) as rating,
    coalesce(p.review_count, 0) as review_count
  from public.properties p
  where p.status = 'approved'
    and coalesce(p.review_count, 0) >= min_reviews
  order by p.rating desc, p.review_count desc, p.title asc
  limit limit_count;
end;
$function$;