
-- 1) messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null references public.bookings(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  message_type text not null default 'text',
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: constrain message_type to expected values (immutable check is OK here)
alter table public.messages
  add constraint message_type_valid
  check (message_type in ('text','image','file'));

-- 2) Indexes for performance
create index if not exists messages_booking_id_idx on public.messages(booking_id);
create index if not exists messages_property_id_idx on public.messages(property_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists messages_booking_created_idx on public.messages(booking_id, created_at);

-- 3) RLS
alter table public.messages enable row level security;

-- Allow participants (sender or receiver) to read messages
drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages
  for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Only the sender can insert their own message
drop policy if exists "Sender can insert message" on public.messages;
create policy "Sender can insert message"
  on public.messages
  for insert
  with check (auth.uid() = sender_id);

-- Only the receiver can update (e.g., mark as read)
drop policy if exists "Receiver can update message" on public.messages;
create policy "Receiver can update message"
  on public.messages
  for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- 4) updated_at trigger
create or replace function public.messages_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_messages_set_updated_at on public.messages;
create trigger trg_messages_set_updated_at
before update on public.messages
for each row
execute function public.messages_set_updated_at();

-- 5) Realtime
alter table public.messages replica identity full;
-- Add to realtime publication (safe if already added)
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.messages';
  exception
    when duplicate_object then null;
  end;
end $$;
