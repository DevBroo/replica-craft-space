
-- 1) Tables

-- SLA policies: configurable per category/priority
create table if not exists public.support_sla_policies (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  priority text not null,
  response_time_minutes integer not null default 60,
  resolution_time_minutes integer not null default 1440,
  is_active boolean not null default true,
  unique (category, priority)
);

-- Core tickets
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  customer_email text,
  customer_phone text,
  subject text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'open',
  category text not null default 'Other',
  assigned_agent uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  resolved_at timestamptz,
  reopened_count integer not null default 0,
  merged_into_ticket_id uuid,
  sla_due_at timestamptz,
  escalation_level integer not null default 0,
  escalated boolean not null default false,
  last_message_at timestamptz,
  satisfaction_rating integer,
  satisfaction_comment text,
  satisfaction_submitted_at timestamptz,
  status_change_reason text
);

-- Threaded messages (public/internal)
create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  author_id uuid,
  author_role text not null,
  content text,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

-- Attachments metadata (use storage bucket for files)
create table if not exists public.support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  message_id uuid,
  storage_path text not null,
  file_name text,
  file_type text,
  file_size bigint,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

-- Status history (auditable)
create table if not exists public.support_ticket_status_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  from_status text,
  to_status text not null,
  reason text,
  actor_id uuid,
  actor_role text,
  created_at timestamptz not null default now()
);

-- Escalations
create table if not exists public.support_ticket_escalations (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  from_level integer,
  to_level integer not null,
  reason text,
  escalated_by uuid,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz
);

-- Merges
create table if not exists public.support_ticket_merges (
  id uuid primary key default gen_random_uuid(),
  source_ticket_id uuid not null,
  target_ticket_id uuid not null,
  merged_by uuid,
  reason text,
  created_at timestamptz not null default now()
);

-- 2) Indexes
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_priority on public.support_tickets(priority);
create index if not exists idx_support_tickets_category on public.support_tickets(category);
create index if not exists idx_support_tickets_created_by on public.support_tickets(created_by);
create index if not exists idx_support_tickets_assigned_agent on public.support_tickets(assigned_agent);
create index if not exists idx_support_tickets_created_at on public.support_tickets(created_at);
create index if not exists idx_stm_ticket on public.support_ticket_messages(ticket_id, created_at);
create index if not exists idx_sta_ticket on public.support_ticket_attachments(ticket_id, created_at);

-- 3) Helper functions

-- identify agents
create or replace function public.is_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agent'
  );
$$;

-- can the current user access a given ticket?
create or replace function public.can_access_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.support_tickets t
    where t.id = p_ticket_id
      and (
        public.is_admin()
        or t.created_by = auth.uid()
        or t.assigned_agent = auth.uid()
      )
  );
$$;

-- 4) Triggers & trigger functions

-- updated_at maintenance (uses existing update_updated_at_column)
drop trigger if exists trg_support_ticket_updated_at on public.support_tickets;
create trigger trg_support_ticket_updated_at
before update on public.support_tickets
for each row execute function public.update_updated_at_column();

-- status change history + timestamps + reopen counting
create or replace function public.support_log_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if old.status is distinct from new.status then
    insert into public.support_ticket_status_history(
      ticket_id, from_status, to_status, reason, actor_id, actor_role
    ) values (
      new.id,
      old.status,
      new.status,
      new.status_change_reason,
      auth.uid(),
      case when public.is_admin() then 'admin'
           when public.is_agent() then 'agent'
           else 'user' end
    );
    if new.status = 'resolved' and new.resolved_at is null then
      new.resolved_at := now();
    end if;
    if new.status = 'closed' and new.closed_at is null then
      new.closed_at := now();
    end if;
    if old.status = 'closed' and new.status = 'open' then
      new.reopened_count := coalesce(old.reopened_count, 0) + 1;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_support_ticket_status_change on public.support_tickets;
create trigger trg_support_ticket_status_change
before update on public.support_tickets
for each row execute function public.support_log_ticket_status_change();

-- SLA due calculation on create / priority/category change
create or replace function public.support_set_sla_due()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_resolution_minutes integer;
begin
  if tg_op = 'INSERT'
     or new.priority is distinct from old.priority
     or new.category is distinct from old.category then

    select resolution_time_minutes
      into v_resolution_minutes
    from public.support_sla_policies
    where is_active = true
      and category = new.category
      and priority = new.priority
    limit 1;

    if v_resolution_minutes is null then
      -- fallback by priority
      v_resolution_minutes := case
        when lower(new.priority) = 'high' then 480
        when lower(new.priority) = 'medium' then 1440
        else 4320
      end;
    end if;

    new.sla_due_at := new.created_at + make_interval(mins => v_resolution_minutes);
    new.escalated := false;
    new.escalation_level := 0;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_support_ticket_sla on public.support_tickets;
create trigger trg_support_ticket_sla
before insert or update of priority, category on public.support_tickets
for each row execute function public.support_set_sla_due();

-- message insert side-effects (update last_message_at)
create or replace function public.support_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.support_tickets
     set last_message_at = new.created_at,
         updated_at = now()
   where id = new.ticket_id;
  return new;
end;
$function$;

drop trigger if exists trg_support_message_on_insert on public.support_ticket_messages;
create trigger trg_support_message_on_insert
after insert on public.support_ticket_messages
for each row execute function public.support_on_message_insert();

-- attachment internal flag sync from message
create or replace function public.support_sync_attachment_internal()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_is_internal boolean;
begin
  if new.message_id is not null then
    select m.is_internal into v_is_internal
      from public.support_ticket_messages m
     where m.id = new.message_id;
    if found then
      new.is_internal := coalesce(v_is_internal, false);
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_support_attachment_internal on public.support_ticket_attachments;
create trigger trg_support_attachment_internal
before insert on public.support_ticket_attachments
for each row execute function public.support_sync_attachment_internal();

-- 5) RLS

alter table public.support_sla_policies enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.support_ticket_attachments enable row level security;
alter table public.support_ticket_status_history enable row level security;
alter table public.support_ticket_escalations enable row level security;
alter table public.support_ticket_merges enable row level security;

-- SLA policies
create policy "Admins manage SLA policies"
  on public.support_sla_policies
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Authenticated can view active SLA policies"
  on public.support_sla_policies
  for select
  using (true);

-- Tickets
create policy "Admins manage tickets"
  on public.support_tickets
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agents view assigned tickets"
  on public.support_tickets
  for select
  using (public.is_agent() and assigned_agent = auth.uid());

create policy "Agents update assigned tickets"
  on public.support_tickets
  for update
  using (public.is_agent() and assigned_agent = auth.uid())
  with check (public.is_agent() and assigned_agent = auth.uid());

create policy "Users create their tickets"
  on public.support_tickets
  for insert
  with check (auth.uid() = created_by);

create policy "Users view their tickets"
  on public.support_tickets
  for select
  using (auth.uid() = created_by);

-- Messages
create policy "Admins manage messages"
  on public.support_ticket_messages
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agents manage messages on assigned tickets"
  on public.support_ticket_messages
  for all
  using (public.is_agent() and public.can_access_ticket(ticket_id))
  with check (public.is_agent() and public.can_access_ticket(ticket_id));

create policy "Users view messages on own tickets (no internal)"
  on public.support_ticket_messages
  for select
  using (public.can_access_ticket(ticket_id) and (not is_internal or public.is_admin() or public.is_agent()));

create policy "Users create public messages on own tickets"
  on public.support_ticket_messages
  for insert
  with check (public.can_access_ticket(ticket_id) and auth.uid() = author_id and is_internal = false);

-- Attachments
create policy "Admins manage attachments"
  on public.support_ticket_attachments
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agents manage attachments for accessible tickets"
  on public.support_ticket_attachments
  for all
  using (public.is_agent() and public.can_access_ticket(ticket_id))
  with check (public.is_agent() and public.can_access_ticket(ticket_id));

create policy "Users view public attachments on own tickets"
  on public.support_ticket_attachments
  for select
  using (public.can_access_ticket(ticket_id) and (not is_internal or public.is_admin() or public.is_agent()));

create policy "Users add public attachments on own tickets"
  on public.support_ticket_attachments
  for insert
  with check (public.can_access_ticket(ticket_id) and is_internal = false);

-- History (admin manage, agents can insert for assigned tickets; read allowed to admin/agent and ticket owner)
create policy "Admins manage history"
  on public.support_ticket_status_history
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agents insert history for assigned tickets"
  on public.support_ticket_status_history
  for insert
  with check (public.is_agent());

create policy "View history: admin/agent/owner"
  on public.support_ticket_status_history
  for select
  using (
    public.is_admin()
    or exists (select 1 from public.support_tickets t where t.id = support_ticket_status_history.ticket_id and (t.created_by = auth.uid() or t.assigned_agent = auth.uid()))
  );

-- Escalations
create policy "Admins manage escalations"
  on public.support_ticket_escalations
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agents insert escalations for assigned tickets"
  on public.support_ticket_escalations
  for insert
  with check (public.is_agent());

create policy "View escalations: admin/agent/owner"
  on public.support_ticket_escalations
  for select
  using (
    public.is_admin()
    or exists (select 1 from public.support_tickets t where t.id = support_ticket_escalations.ticket_id and (t.created_by = auth.uid() or t.assigned_agent = auth.uid()))
  );

-- Merges
create policy "Admins manage merges"
  on public.support_ticket_merges
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Agents insert merges"
  on public.support_ticket_merges
  for insert
  with check (public.is_agent());

create policy "View merges: admin/agent/owner"
  on public.support_ticket_merges
  for select
  using (
    public.is_admin()
    or exists (select 1 from public.support_tickets t where t.id = support_ticket_merges.source_ticket_id and (t.created_by = auth.uid() or t.assigned_agent = auth.uid()))
    or exists (select 1 from public.support_tickets t2 where t2.id = support_ticket_merges.target_ticket_id and (t2.created_by = auth.uid() or t2.assigned_agent = auth.uid()))
  );

-- 6) Analytics function
create or replace function public.get_ticket_analytics(
  start_date date default (current_date - interval '30 days'),
  end_date date default current_date
)
returns table(
  total_tickets bigint,
  open_tickets bigint,
  resolved_tickets bigint,
  avg_resolution_hours numeric,
  by_category jsonb,
  by_status jsonb,
  by_agent jsonb,
  tickets_trend jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $function$
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
      assigned_agent,
      count(*)::bigint as tickets_count,
      avg(extract(epoch from (resolved_at - created_at))/3600.0) as avg_res_hours
    from scoped
    group by assigned_agent
  ),
  agent_json as (
    select json_agg(json_build_object(
      'agent_id', a.assigned_agent,
      'agent_name', p.full_name,
      'tickets', a.tickets_count,
      'avg_resolution_hours', coalesce(a.avg_res_hours, 0)
    )) as j
    from agent_perf a
    left join public.profiles p on p.id = a.assigned_agent
  ),
  daily_trend as (
    select
      created_at::date as day,
      count(*)::bigint as tickets
    from scoped
    group by day
    order by day
  )
  select
    (select count(*) from scoped)::bigint,
    (select count(*) from scoped where status in ('open','in-progress'))::bigint,
    (select count(*) from scoped where status in ('resolved','closed'))::bigint,
    coalesce((
      select avg(extract(epoch from (resolved_at - created_at))/3600.0) from scoped where resolved_at is not null
    ), 0),
    (select json_object_agg(coalesce(category,'unknown'), cnt) from category_counts)::jsonb,
    (select json_object_agg(coalesce(status,'unknown'), cnt) from status_counts)::jsonb,
    (select coalesce(j, '[]'::json) from agent_json)::jsonb,
    (select json_agg(json_build_object('date', day, 'tickets', tickets)) from daily_trend)::jsonb;
end;
$function$;

-- 7) Seed default SLA policies (idempotent via upserts)
insert into public.support_sla_policies (category, priority, response_time_minutes, resolution_time_minutes, is_active)
values
  ('Payment', 'high', 30, 480, true),
  ('Payment', 'medium', 60, 1440, true),
  ('Payment', 'low', 240, 4320, true),
  ('Booking', 'high', 30, 480, true),
  ('Booking', 'medium', 60, 1440, true),
  ('Booking', 'low', 240, 4320, true),
  ('Property', 'high', 60, 720, true),
  ('Property', 'medium', 120, 2880, true),
  ('Property', 'low', 360, 5760, true),
  ('Technical', 'high', 30, 480, true),
  ('Technical', 'medium', 60, 1440, true),
  ('Technical', 'low', 240, 4320, true),
  ('Other', 'high', 60, 720, true),
  ('Other', 'medium', 120, 2880, true),
  ('Other', 'low', 360, 5760, true)
on conflict (category, priority) do update
  set response_time_minutes = excluded.response_time_minutes,
      resolution_time_minutes = excluded.resolution_time_minutes,
      is_active = excluded.is_active;
