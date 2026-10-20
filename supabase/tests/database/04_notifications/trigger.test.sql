-- Tests the BEFORE INSERT trigger that resolves target -> audience_ids.
-- Dispatch is skipped via a session setting so no HTTP calls fire.
begin;
select
    plan (5);
-- Skip HTTP dispatch during tests.
set local app.skip_dispatch = 'true';
-- Seed.
insert into auth.users (id, email)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, email, notification_tags)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com', array['branch:cs']),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com', array['branch:me'])
on conflict (id)
    do update set
        notification_tags = excluded.notification_tags;
-- Broadcast: audience_ids stays NULL, dispatched_at stays NULL.
insert into notifications (title, message, target)
    values ('Test', 'Oui', '{"type": "broadcast"}'::jsonb);
select
    is ((
            select
                audience_ids
            from
                notifications
            where
                title = 'Test'), null::uuid[], 'broadcast leaves audience_ids null');
select
    is ((
            select
                dispatched_at
            from
                notifications
            where
                title = 'Test'), null::timestamptz, 'dispatched_at is null until push fanout runs');
-- Tagged: audience_ids gets populated by the trigger.
insert into notifications (title, message, target)
    values ('T1', 'Hola', '{"type": "tag", "tag": "branch:cs"}'::jsonb);
select
    is ((
            select
                audience_ids
            from
                notifications
            where
                title = 'T1'), array['11111111-1111-1111-1111-111111111111']::uuid[], 'tag trigger populates audience_ids');
-- User target.
insert into notifications (title, message, target)
    values ('U1', 'Namaste', '{"type": "user", "user_id": "22222222-2222-2222-2222-222222222222"}'::jsonb);
select
    is ((
            select
                audience_ids
            from
                notifications
            where
                title = 'U1'), array['22222222-2222-2222-2222-222222222222']::uuid[], 'user target populates audience_ids with the single user');
-- Default target — omit target column entirely.
insert into notifications (title, message)
    values ('D1', 'Bonjour');
select
    is ((
            select
                target
            from
                notifications
            where
                title = 'D1'), '{"type": "broadcast"}'::jsonb, 'omitting target defaults to broadcast');
select
    *
from
    finish ();
rollback;
