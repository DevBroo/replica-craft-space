
-- 1) Table: commission_disbursements
create table if not exists public.commission_disbursements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid null references public.profiles(id) on delete set null,

  total_booking_amount numeric not null default 0,
  admin_commission numeric not null default 0,
  owner_share numeric not null default 0,
  agent_commission numeric not null default 0,

  disbursement_status text not null default 'pending', -- pending, approved, rejected, processing, paid, failed
  due_date date null,

  payment_mode text null,            -- UPI, Bank Transfer, etc.
  payment_reference text null,       -- txn id / reference
  payment_date timestamptz null,

  failure_reason text null,
  notes text null,

  approved_by uuid null references public.profiles(id) on delete set null,
  approved_at timestamptz null,
  rejected_reason text null,
  rejected_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint commission_disbursements_booking_unique unique (booking_id)
);

-- helpful indexes
create index if not exists idx_commissions_status on public.commission_disbursements (disbursement_status);
create index if not exists idx_commissions_owner on public.commission_disbursements (owner_id);
create index if not exists idx_commissions_agent on public.commission_disbursements (agent_id);
create index if not exists idx_commissions_due_date on public.commission_disbursements (due_date);

-- updated_at trigger
drop trigger if exists trg_commissions_updated_at on public.commission_disbursements;
create trigger trg_commissions_updated_at
before update on public.commission_disbursements
for each row execute function public.update_updated_at_column();

-- 2) RLS
alter table public.commission_disbursements enable row level security;

-- Admins can manage all
drop policy if exists "Admins can manage commission_disbursements" on public.commission_disbursements;
create policy "Admins can manage commission_disbursements"
on public.commission_disbursements
as permissive
for all
using (is_admin())
with check (is_admin());

-- Owners can view their commissions
drop policy if exists "Owners can view their commissions" on public.commission_disbursements;
create policy "Owners can view their commissions"
on public.commission_disbursements
as permissive
for select
to authenticated
using (owner_id = auth.uid());

-- Agents can view their commissions
drop policy if exists "Agents can view their commissions" on public.commission_disbursements;
create policy "Agents can view their commissions"
on public.commission_disbursements
as permissive
for select
to authenticated
using (agent_id = auth.uid());

-- 3) Functions

-- Generate a commission row for a booking (Admin only)
create or replace function public.generate_commission_for_booking(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
  v_owner uuid;
  v_admin_rate numeric := 0.10; -- fallback if owner's commission_rate not set
  v_agent_rate numeric := 0.00; -- fallback if agent's commission_rate not set
  v_admin_commission numeric := 0;
  v_agent_commission numeric := 0;
  v_owner_share numeric := 0;
  v_due_date date := (now() + interval '7 days')::date;
  v_new_id uuid;
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  select b.*, p.owner_id into v_booking
  from public.bookings b
  join public.properties p on p.id = b.property_id
  where b.id = p_booking_id;

  if not found then
    raise exception 'Booking not found';
  end if;

  v_owner := v_booking.owner_id;

  -- use commission_rate from profiles as configurable rates
  select coalesce(commission_rate, 0.10) into v_admin_rate from public.profiles where id = v_owner;
  if v_booking.agent_id is not null then
    select coalesce(commission_rate, 0.00) into v_agent_rate from public.profiles where id = v_booking.agent_id;
  end if;

  v_admin_commission := coalesce(v_booking.total_amount, 0) * v_admin_rate;
  v_agent_commission := coalesce(v_booking.total_amount, 0) * v_agent_rate;
  v_owner_share := coalesce(v_booking.total_amount, 0) - v_admin_commission - v_agent_commission;

  insert into public.commission_disbursements(
    booking_id, property_id, owner_id, agent_id,
    total_booking_amount, admin_commission, owner_share, agent_commission,
    disbursement_status, due_date
  )
  values (
    v_booking.id, v_booking.property_id, v_owner, v_booking.agent_id,
    coalesce(v_booking.total_amount, 0), v_admin_commission, v_owner_share, v_agent_commission,
    'pending', v_due_date
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- Approve a commission (Admin only)
create or replace function public.approve_commission(p_commission_id uuid, p_notes text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.commission_disbursements
     set disbursement_status = 'approved',
         approved_by = auth.uid(),
         approved_at = now(),
         notes = coalesce(p_notes, notes)
   where id = p_commission_id;

  return true;
end;
$$;

-- Reject a commission (Admin only)
create or replace function public.reject_commission(p_commission_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.commission_disbursements
     set disbursement_status = 'rejected',
         rejected_reason = p_reason,
         rejected_at = now()
   where id = p_commission_id;

  return true;
end;
$$;

-- Process payment (Admin only) - marks "paid" and notifies owner/agent
create or replace function public.process_commission_payment(
  p_commission_id uuid,
  p_payment_mode text,
  p_payment_reference text,
  p_payment_date timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_agent uuid;
  v_property_id uuid;
  v_booking_id uuid;
  v_amount numeric;
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.commission_disbursements
     set disbursement_status = 'paid',
         payment_mode = p_payment_mode,
         payment_reference = p_payment_reference,
         payment_date = p_payment_date,
         failure_reason = null
   where id = p_commission_id;

  select owner_id, agent_id, property_id, booking_id, owner_share
    into v_owner, v_agent, v_property_id, v_booking_id, v_amount
  from public.commission_disbursements
  where id = p_commission_id;

  -- notify owner
  if v_owner is not null then
    insert into public.notifications(target_user_id, related_entity_id, title, content, related_entity_type, status)
    values (
      v_owner, v_booking_id,
      'Commission Disbursed',
      'Your commission has been paid. Amount: ' || coalesce(v_amount, 0)::text,
      'commission', 'unread'
    );
  end if;

  -- notify agent (if any)
  if v_agent is not null then
    insert into public.notifications(target_user_id, related_entity_id, title, content, related_entity_type, status)
    values (
      v_agent, v_booking_id,
      'Agent Commission Disbursed',
      'Your agent commission has been paid.',
      'commission', 'unread'
    );
  end if;

  return true;
end;
$$;

-- Mark commission as failed (Admin only)
create or replace function public.mark_commission_failed(p_commission_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.commission_disbursements
     set disbursement_status = 'failed',
         failure_reason = p_reason
   where id = p_commission_id;

  return true;
end;
$$;

-- Bulk update status (Admin only)
create or replace function public.bulk_update_commission_status(
  p_ids uuid[],
  p_new_status text,
  p_failure_reason text default null,
  p_notes text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.commission_disbursements
     set disbursement_status = p_new_status,
         failure_reason = case when p_new_status = 'failed' then p_failure_reason else failure_reason end,
         notes = coalesce(p_notes, notes)
   where id = any(p_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 4) Admin list view with joined info
drop view if exists public.commission_admin_list;
create view public.commission_admin_list as
select
  cd.id,
  cd.booking_id,
  cd.property_id,
  cd.owner_id,
  cd.agent_id,

  cd.total_booking_amount,
  cd.admin_commission,
  cd.owner_share,
  cd.agent_commission,

  cd.disbursement_status,
  cd.due_date,

  cd.payment_mode,
  cd.payment_reference,
  cd.payment_date,

  cd.failure_reason,
  cd.notes,

  cd.approved_by,
  cd.approved_at,
  cd.rejected_reason,
  cd.rejected_at,

  cd.created_at,
  cd.updated_at,

  b.check_in_date,
  b.check_out_date,

  p.title as property_title,

  o.full_name as owner_name,
  o.email as owner_email,

  a.full_name as agent_name,
  a.email as agent_email
from public.commission_disbursements cd
join public.bookings b on b.id = cd.booking_id
join public.properties p on p.id = cd.property_id
left join public.profiles o on o.id = cd.owner_id
left join public.profiles a on a.id = cd.agent_id;

-- Note: The view is for admin; no RLS on views. Admin UI should query this view.
