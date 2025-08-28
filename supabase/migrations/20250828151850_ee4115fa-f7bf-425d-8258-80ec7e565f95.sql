
-- 1) RPC to atomically update property status, log history, and notify owner
create or replace function public.log_property_status_change(
  p_property_id uuid,
  p_to_status text,
  p_reason text,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_status text;
  v_owner_id uuid;
  v_actor_role text;
begin
  -- Fetch current status and owner
  select status, owner_id into v_from_status, v_owner_id
  from public.properties
  where id = p_property_id;

  -- Update property status
  update public.properties
  set status = p_to_status,
      updated_at = now()
  where id = p_property_id;

  -- Determine actor role (best-effort)
  select role into v_actor_role
  from public.profiles
  where id = auth.uid();

  -- Log status history
  insert into public.property_status_history (
    property_id, actor_id, actor_role, from_status, to_status, reason, comment, created_at
  ) values (
    p_property_id, auth.uid(), v_actor_role, v_from_status, p_to_status, p_reason, p_comment, now()
  );

  -- Notify owner (best-effort)
  insert into public.notifications (
    target_user_id, related_entity_id, related_entity_type, title, content, type, priority, status, created_at
  ) values (
    v_owner_id,
    p_property_id,
    'property',
    case
      when p_to_status = 'approved' then 'Your property was approved'
      when p_to_status = 'rejected' then 'Your property was rejected'
      when p_to_status = 'pending'  then 'Changes requested on your property'
      else 'Property status updated'
    end,
    coalesce(p_comment, p_reason),
    'info',
    'normal',
    'unread',
    now()
  );
end;
$$;

grant execute on function public.log_property_status_change(uuid, text, text, text) to authenticated;


-- 2) RPC to get approval stats including avg pending hours
-- avg_pending_hours is computed from the last time a property became pending (if available) or created_at as fallback.
create or replace function public.get_property_approval_stats()
returns table (
  total_pending integer,
  total_approved integer,
  total_rejected integer,
  avg_pending_hours numeric
)
language sql
stable
security definer
set search_path = public
as $$
with pending_props as (
  select p.id, p.created_at
  from public.properties p
  where p.status = 'pending'
),
last_pending as (
  select h.property_id, max(h.created_at) as last_pending_at
  from public.property_status_history h
  where h.to_status = 'pending'
  group by h.property_id
),
pending_with_baseline as (
  select
    pp.id,
    coalesce(lp.last_pending_at, pp.created_at) as baseline
  from pending_props pp
  left join last_pending lp on lp.property_id = pp.id
)
select
  (select count(*) from public.properties where status = 'pending') as total_pending,
  (select count(*) from public.properties where status = 'approved') as total_approved,
  (select count(*) from public.properties where status = 'rejected') as total_rejected,
  coalesce((
    select avg(extract(epoch from (now() - baseline)) / 3600.0)
    from pending_with_baseline
  ), 0) as avg_pending_hours;
$$;

grant execute on function public.get_property_approval_stats() to authenticated;
