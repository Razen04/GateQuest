-- Tests resolve_notification_target(jsonb) -> uuid[]
-- Returns NULL for broadcast (semantics: "everyone").
-- Returns a uuid[] for every other target type.
begin;
select
    plan (9);
-- Seed. Insert into auth.users triggers a public.users insert via
-- the existing handle_new_user trigger (if you have one). We upsert
-- into public.users afterward to set notification_tags regardless.
insert into auth.users (id, email)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com'),
    ('33333333-3333-3333-3333-333333333333', 'user3@test.com'),
    ('44444444-4444-4444-4444-444444444444', 'user4@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, email, notification_tags)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com', array['branch:cs', 'exam:gate']),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com', array['branch:cs', 'exam:gate', 'exam:isro']),
    ('33333333-3333-3333-3333-333333333333', 'user3@test.com', array['branch:me', 'exam:gate']),
    ('44444444-4444-4444-4444-444444444444', 'user4@test.com', array['branch:cs'])
on conflict (id)
    do update set
        notification_tags = excluded.notification_tags;
-- Broadcast: NULL means everyone.
select
    is (resolve_notification_target ('{"type": "broadcast"}'::jsonb),
        null::uuid[],
        'broadcast returns NULL (universal)');
-- Single user.
select
    is (resolve_notification_target ('{"type": "user", "user_id": "11111111-1111-1111-1111-111111111111"}'::jsonb),
        array['11111111-1111-1111-1111-111111111111']::uuid[],
        'user target returns that user');
-- Explicit list.
select
    is (resolve_notification_target ('{"type": "users", "user_ids": ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"]}'::jsonb),
        array['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']::uuid[],
        'users target returns the explicit list');
-- Tag: branch:cs — matches user1, user2, user4.
select
    is (array_length(resolve_notification_target ('{"type": "tag", "tag": "branch:cs"}'::jsonb), 1),
        3,
        'branch:cs returns 3 users');
select
    ok ('11111111-1111-1111-1111-111111111111' = any (resolve_notification_target ('{"type": "tag", "tag": "branch:cs"}'::jsonb)),
        'branch:cs includes user1');
select
    ok (not ('33333333-3333-3333-3333-333333333333' = any (resolve_notification_target ('{"type": "tag", "tag": "branch:cs"}'::jsonb))),
        'branch:cs excludes ME user3');
-- Tag: exam:isro — only user2.
select
    is (resolve_notification_target ('{"type": "tag", "tag": "exam:isro"}'::jsonb),
        array['22222222-2222-2222-2222-222222222222']::uuid[],
        'exam:isro returns only user2');
-- Tag: nonexistent — empty array, not error.
select
    is (resolve_notification_target ('{"type": "tag", "tag": "branch:xyz"}'::jsonb),
        array[]::uuid[],
        'unknown tag returns empty array');
-- Segment: unknown — should raise.
select
    throws_ok ($$select resolve_notification_target('{"type": "segment", "segment": "nope"}'::jsonb)$$, 'P0001', null, 'unknown segment raises exception');
select
    *
from
    finish ();
rollback;
