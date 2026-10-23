-- Per-user read state for notifications.
create table if not exists public.notification_reads (
    notification_id uuid not null references public.notifications (id) on delete cascade,
    user_id uuid not null references public.users (id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (notification_id, user_id)
);

create index if not exists idx_notification_reads_user on public.notification_reads (user_id);

alter table public.notification_reads enable row level security;

drop policy if exists "notification_reads_select_own" on public.notification_reads;

create policy "notification_reads_select_own" on public.notification_reads
    for select to authenticated
    using (user_id = auth.uid ());

drop policy if exists "notification_reads_insert_own" on public.notification_reads;

create policy "notification_reads_insert_own" on public.notification_reads
    for insert to authenticated
    with check (user_id = auth.uid ());

drop policy if exists "notification_reads_delete_own" on public.notification_reads;

create policy "notification_reads_delete_own" on public.notification_reads
    for delete to authenticated
    using (user_id = auth.uid ());

