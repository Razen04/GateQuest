-- Tests the SELECT policy: broadcast + targeted + read-state filtering.
begin;
select
    plan (7);
set local app.skip_dispatch = 'true';
truncate public.notifications cascade;
-- Seed users.
insert into auth.users (id, email)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com'),
    ('33333333-3333-3333-3333-333333333333', 'user3@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, email, notification_tags)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com', array['branch:cs']),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com', array['branch:cs']),
    ('33333333-3333-3333-3333-333333333333', 'user3@test.com', array['branch:me'])
on conflict (id)
    do update set
        notification_tags = excluded.notification_tags;
-- Seed notifications as superuser (service role context).
insert into notifications (id, title, message, target, audience_ids)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Broadcast', 'all', '{"type": "broadcast"}'::jsonb, null),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CS Only', 'cs', '{"type": "tag", "tag": "branch:cs"}'::jsonb, array['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']::uuid[]),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ME Only', 'me', '{"type": "tag", "tag": "branch:me"}'::jsonb, array['33333333-3333-3333-3333-333333333333']::uuid[]);
-- ---------- user1 (CS) ----------
set local role authenticated;
select
    set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
select
    is ((
            select
                count(*)::int
            from
                notifications),
            2,
            'user1 sees broadcast + CS-only');
select
    ok (exists (
            select
                1
            from
                notifications
            where
                title = 'Broadcast'), 'user1 sees broadcast');
select
    ok (not exists (
            select
                1
            from
                notifications
            where
                title = 'ME Only'), 'user1 does not see ME-only');
-- Mark broadcast as read for user1.
reset role;
insert into notification_reads (notification_id, user_id)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111');
-- ---------- user1 again: broadcast should be hidden ----------
set local role authenticated;
select
    set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
select
    is ((
            select
                count(*)::int
            from
                notifications),
            1,
            'user1 sees only CS-only after marking broadcast as read');
-- ---------- user2: broadcast still visible (read state is per-user) ----------
reset role;
set local role authenticated;
select
    set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);
select
    ok (exists (
            select
                1
            from
                notifications
            where
                title = 'Broadcast'), 'user2 still sees broadcast after user1 marked it read');
-- ---------- user3 (ME): only ME-only ----------
reset role;
set local role authenticated;
select
    set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333"}', true);
select
    ok (exists (
            select
                1
            from
                notifications
            where
                title = 'ME Only'), 'user3 sees ME-only');
select
    ok (not exists (
            select
                1
            from
                notifications
            where
                title = 'CS Only'), 'user3 does not see CS-only');
select
    *
from
    finish ();
rollback;
