
  -- 1) Helper: function to verify that the current user participates in the booking
  -- Assumes bookings(id, user_id, property_id) and properties(id, owner_id)
  create or replace function public.is_booking_participant(_booking_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select exists (
      select 1
      from public.bookings b
      join public.properties p on p.id = b.property_id
      where b.id = _booking_id
        and (b.user_id = auth.uid() or p.owner_id = auth.uid())
    );
  $$;

  -- 2) Messages table (idempotent)
  create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null,
    property_id uuid not null,
    sender_id uuid not null,
    receiver_id uuid not null,
    message text not null,
    message_type text not null default 'text',
    is_read boolean not null default false,
    read_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Optional FKs (avoid auth.users FK per guidelines)
  do $$
  begin
    if not exists (
      select 1 from pg_constraint where conname = 'messages_booking_fk'
    ) then
      alter table public.messages
        add constraint messages_booking_fk
        foreign key (booking_id) references public.bookings(id) on delete cascade;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'messages_property_fk'
    ) then
      alter table public.messages
        add constraint messages_property_fk
        foreign key (property_id) references public.properties(id) on delete cascade;
    end if;
  end$$;

  -- 3) Useful indexes
  create index if not exists messages_receiver_idx on public.messages (receiver_id, is_read);
  create index if not exists messages_booking_idx on public.messages (booking_id);
  create index if not exists messages_property_idx on public.messages (property_id);

  -- 4) RLS: only participants can read/insert; receiver can mark read
  alter table public.messages enable row level security;

  do $$
  begin
    if not exists (
      select 1 from pg_policies where polname = 'Participants can read messages'
    ) then
      create policy "Participants can read messages"
      on public.messages
      for select
      using (public.is_booking_participant(booking_id));
    end if;

    if not exists (
      select 1 from pg_policies where polname = 'Participants can insert messages'
    ) then
      create policy "Participants can insert messages"
      on public.messages
      for insert
      with check (auth.uid() = sender_id and public.is_booking_participant(booking_id));
    end if;

    if not exists (
      select 1 from pg_policies where polname = 'Receiver can update read status'
    ) then
      create policy "Receiver can update read status"
      on public.messages
      for update
      using (auth.uid() = receiver_id)
      with check (auth.uid() = receiver_id);
    end if;
  end$$;

  -- 5) Trigger to maintain updated_at
  create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  as $$
  begin
    new.updated_at := now();
    return new;
  end
  $$;

  do $$
  begin
    if not exists (
      select 1 from pg_trigger where tgname = 'set_messages_updated_at'
    ) then
      create trigger set_messages_updated_at
      before update on public.messages
      for each row execute procedure public.set_updated_at();
    end if;
  end$$;

  -- 6) Realtime enablement
  alter table public.messages replica identity full;

  do $$
  begin
    -- Add to supabase_realtime publication if not already present
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
  end$$;
  