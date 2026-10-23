-- Adds targeting, metadata, and dispatch-tracking columns to notifications,
-- plus the notification_tags array on users.
alter table public.notifications
    add column if not exists target jsonb not null default '{"type": "broadcast"}'::jsonb,
    add column if not exists audience_ids uuid[] default null,
    add column if not exists link text,
    add column if not exists dispatched_at timestamptz;

alter table public.notifications
    alter column active set default true;

alter table public.notifications
    drop constraint if exists notifications_target_valid;

alter table public.notifications
    add constraint notifications_target_valid check (target ? 'type' and (target ->> 'type') in ('broadcast', 'user', 'users', 'tag', 'segment'));

alter table public.notifications
    alter column created_at set default now();

create index if not exists idx_notifications_audience on public.notifications using gin (audience_ids);

create index if not exists idx_notifications_target_type on public.notifications ((target ->> 'type'));

create index if not exists idx_notifications_undispatched on public.notifications (created_at)
where
    dispatched_at is null;

create index if not exists idx_notifications_active_created on public.notifications (active, created_at desc)
where
    active = true;

-- users table update
alter table public.users
    add column if not exists notification_tags text[] not null default '{}'::text[];

create index if not exists idx_users_notification_tags on public.users using gin (notification_tags);

