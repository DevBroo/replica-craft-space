-- Add foreign key constraints for data integrity
ALTER TABLE public.support_tickets 
ADD CONSTRAINT fk_support_tickets_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets 
ADD CONSTRAINT fk_support_tickets_assigned_agent 
FOREIGN KEY (assigned_agent) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_agent ON public.support_tickets(assigned_agent);

-- Update get_ticket_analytics function to always return chartable data
CREATE OR REPLACE FUNCTION public.get_ticket_analytics(start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(total_tickets bigint, open_tickets bigint, resolved_tickets bigint, avg_resolution_hours numeric, by_category jsonb, by_status jsonb, by_agent jsonb, tickets_trend jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Admin access required for ticket analytics';
  end if;

  return query
  with scoped as (
    select *
    from public.support_tickets
    where created_at::date between start_date and end_date
  ),
  category_counts as (
    select category, count(*)::bigint as cnt
    from scoped group by category
  ),
  status_counts as (
    select status, count(*)::bigint as cnt
    from scoped group by status
  ),
  agent_perf as (
    select
      st.assigned_agent,
      p.full_name as agent_name,
      count(*)::bigint as tickets_count,
      coalesce(avg(extract(epoch from (st.resolved_at - st.created_at))/3600.0), 0) as avg_res_hours
    from scoped st
    left join public.profiles p on p.id = st.assigned_agent
    where st.assigned_agent is not null
    group by st.assigned_agent, p.full_name
  ),
  agent_json as (
    select coalesce(json_agg(json_build_object(
      'agent_id', a.assigned_agent,
      'agent_name', coalesce(a.agent_name, 'Unknown'),
      'tickets', a.tickets_count,
      'avg_resolution_hours', a.avg_res_hours
    )), '[]'::json) as j
    from agent_perf a
  ),
  date_series as (
    select generate_series(start_date::timestamp, end_date::timestamp, '1 day'::interval)::date as day
  ),
  daily_trend as (
    select
      ds.day,
      coalesce(count(s.id), 0)::bigint as tickets
    from date_series ds
    left join scoped s on s.created_at::date = ds.day
    group by ds.day
    order by ds.day
  )
  select
    coalesce((select count(*) from scoped), 0)::bigint,
    coalesce((select count(*) from scoped where status in ('open','in-progress')), 0)::bigint,
    coalesce((select count(*) from scoped where status in ('resolved','closed')), 0)::bigint,
    coalesce((
      select avg(extract(epoch from (resolved_at - created_at))/3600.0) from scoped where resolved_at is not null
    ), 0),
    coalesce((select json_object_agg(coalesce(category,'other'), cnt) from category_counts), '{}'::json)::jsonb,
    coalesce((select json_object_agg(coalesce(status,'unknown'), cnt) from status_counts), '{}'::json)::jsonb,
    coalesce((select j from agent_json), '[]'::json)::jsonb,
    coalesce((select json_agg(json_build_object('date', day::text, 'tickets', tickets)) from daily_trend), '[]'::json)::jsonb;
end;
$function$;