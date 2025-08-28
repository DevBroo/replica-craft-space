
-- 1) Fix time-series to use safe grouping and subqueries (defensive re-apply)
CREATE OR REPLACE FUNCTION public.get_time_series_analytics(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE,
  granularity text DEFAULT 'day'::text,
  v_owner_id uuid DEFAULT NULL::uuid,
  v_agent_id uuid DEFAULT NULL::uuid,
  v_property_type text DEFAULT NULL::text
)
RETURNS TABLE(
  period timestamptz,
  total_bookings bigint,
  total_revenue numeric,
  average_booking_value numeric,
  bookings_by_status jsonb,
  payments_by_status jsonb,
  refunds_total numeric,
  cancellations bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
      and (v_owner_id is null or p.owner_id = v_owner_id)
      and (v_agent_id is null or b.agent_id = v_agent_id)
      and (v_property_type is null or p.property_type = v_property_type)
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

-- 2) Fix get_revenue_by_property (avoid max(uuid), qualify ORDER BY)
CREATE OR REPLACE FUNCTION public.get_revenue_by_property(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE,
  v_owner_filter uuid DEFAULT NULL::uuid,
  v_agent_filter uuid DEFAULT NULL::uuid,
  v_property_type_filter text DEFAULT NULL::text,
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
STABLE
SECURITY DEFINER
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
      and (v_owner_filter is null or p.owner_id = v_owner_filter)
      and (v_agent_filter is null or b.agent_id = v_agent_filter)
      and (v_property_type_filter is null or p.property_type = v_property_type_filter)
  ),
  agg as (
    select
      s.property_id,
      max(s.title) as property_title,
      -- Avoid aggregate on uuid directly for maximum compatibility
      min((s.p_owner_id)::text)::uuid as owner_id,
      max(s.owner_name) as owner_name,
      coalesce(sum(case when s.status = 'confirmed' then s.total_amount else 0 end), 0) as revenue,
      count(*)::bigint as bookings_count,
      sum(case when s.status ilike 'cancel%%' then 1 else 0 end)::bigint as cancellations,
      coalesce(sum(s.refund_amount), 0) as refunds_total
    from scoped s
    group by s.property_id
  )
  select *
  from agg a
  order by
    case when lower(sort_by)='revenue'      and lower(sort_dir)='asc'  then a.revenue end asc,
    case when lower(sort_by)='revenue'      and lower(sort_dir)='desc' then a.revenue end desc,
    case when lower(sort_by)='bookings'     and lower(sort_dir)='asc'  then a.bookings_count end asc,
    case when lower(sort_by)='bookings'     and lower(sort_dir)='desc' then a.bookings_count end desc,
    case when lower(sort_by)='cancellations'and lower(sort_dir)='asc'  then a.cancellations end asc,
    case when lower(sort_by)='cancellations'and lower(sort_dir)='desc' then a.cancellations end desc,
    a.property_title asc
  limit limit_count offset offset_count;
end;
$function$;

-- 3) Fix get_revenue_by_owner (qualify ORDER BY)
CREATE OR REPLACE FUNCTION public.get_revenue_by_owner(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE,
  v_agent_filter uuid DEFAULT NULL::uuid,
  v_property_type_filter text DEFAULT NULL::text,
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
STABLE
SECURITY DEFINER
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
      and (v_agent_filter is null or b.agent_id = v_agent_filter)
      and (v_property_type_filter is null or p.property_type = v_property_type_filter)
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
  from agg a
  order by
    case when lower(sort_by)='revenue'      and lower(sort_dir)='asc'  then a.revenue end asc,
    case when lower(sort_by)='revenue'      and lower(sort_dir)='desc' then a.revenue end desc,
    case when lower(sort_by)='bookings'     and lower(sort_dir)='asc'  then a.bookings_count end asc,
    case when lower(sort_by)='bookings'     and lower(sort_dir)='desc' then a.bookings_count end desc,
    case when lower(sort_by)='cancellations'and lower(sort_dir)='asc'  then a.cancellations end asc,
    case when lower(sort_by)='cancellations'and lower(sort_dir)='desc' then a.cancellations end desc,
    a.owner_name asc
  limit limit_count offset offset_count;
end;
$function$;

-- 4) Fix get_revenue_by_agent (qualify ORDER BY)
CREATE OR REPLACE FUNCTION public.get_revenue_by_agent(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE,
  v_owner_filter uuid DEFAULT NULL::uuid,
  v_property_type_filter text DEFAULT NULL::text,
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
STABLE
SECURITY DEFINER
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
      and (v_owner_filter is null or p.owner_id = v_owner_filter)
      and (v_property_type_filter is null or p.property_type = v_property_type_filter)
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
  from agg a
  order by
    case when lower(sort_by)='revenue'      and lower(sort_dir)='asc'  then a.revenue end asc,
    case when lower(sort_by)='revenue'      and lower(sort_dir)='desc' then a.revenue end desc,
    case when lower(sort_by)='bookings'     and lower(sort_dir)='asc'  then a.bookings_count end asc,
    case when lower(sort_by)='bookings'     and lower(sort_dir)='desc' then a.bookings_count end desc,
    case when lower(sort_by)='cancellations'and lower(sort_dir)='asc'  then a.cancellations end asc,
    case when lower(sort_by)='cancellations'and lower(sort_dir)='desc' then a.cancellations end desc,
    a.agent_name asc
  limit limit_count offset offset_count;
end;
$function$;
