begin;
select
    plan (14);

\set gone       'a0000000-0000-4000-8000-000000000001'
\set question   'a0000000-0000-4000-8000-000000000002'
\set session    'a0000000-0000-4000-8000-000000000003'

-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
    values (:'gone', 'deleteme@test.com')
on conflict
    do nothing;

insert into public.users (id, username, name, is_public, about, banner, notification_tags)
    values (:'gone', 'deleteme', 'Delete Me', true, 'my bio', 'https://example.com/banner.png', array['role:donor', 'donor:tier-1'])
on conflict
    do nothing;

insert into public.questions (id, year, subject, question_type, question, correct_answer)
    values (:'question', 2026, 'QA', 'multiple-choice', 'Q?', '[0]'::jsonb)
on conflict
    do nothing;

insert into public.users_social (user_id, github_url)
    values (:'gone', 'https://github.com/deleteme');

insert into public.question_reports (user_id, question_id, report_text)
    values (:'gone', :'question', 'bad question');

insert into public.user_question_activity (user_id, question_id, branch_id, was_correct, attempt_number)
    values (:'gone', :'question', 'cs', true, 1);

insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
    values (:'session', :'gone', array['QA'], 1, 100, 'completed', 1, 'cs', 'mock-delete', false);

insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
    values (:'session', :'question', 1, 'answered');

insert into public.question_bookmarks (user_id, question_id)
    values (:'gone', :'question');

insert into public.push_subscriptions (user_id, endpoint, auth_key, p256dh_key)
    values (:'gone', 'https://example.com/push', 'auth', 'p256dh');

insert into public.donations (user_id, utr, verified)
    values (:'gone', 'DELETE-UTR-1', true);

insert into storage.objects (bucket_id, name)
    values ('avatars', :'gone' || '/123.png'), ('banners', :'gone' || '/456.png');

-- ─── Call the RPC as the user ──────────────────────────────────────
set local role authenticated;
select
    set_config('request.jwt.claim.sub', :'gone', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'gone', 'role', 'authenticated')::text, true);
select
    public.delete_account ();
reset role;

-- ─── The users row stays, but carries no identity ──────────────────
select
    ok (exists (
            select
                1
            from
                public.users
            where
                id = :'gone'), 'users row is kept so activity is not cascaded away');

select
    ok ((
            select
                deleted_at is not null
            from
                public.users
            where
                id = :'gone'), 'users row is soft-deleted');

select
    ok ((
            select
                username is null
                and is_public is false
                and about is null
                and banner is null
                and notification_tags = '{}'::text[]
            from
                public.users
            where
                id = :'gone'), 'username, visibility, bio, banner and tier tags are cleared');

select
    throws_ok ($$ select public.get_public_profile('deleteme') $$, 'P0001', null, 'deleted profile is no longer reachable');

-- ─── Community data is kept, personal rows are gone ────────────────
select
    is ((
            select
                count(*)::int
            from
                public.user_question_activity
            where
                user_id = :'gone'), 1, 'question activity is kept anonymously');

select
    is ((
            select
                user_id
            from
                public.question_reports
            where
                report_text = 'bad question'), null::uuid, 'report survives but is detached from the user');

select
    is ((
            select
                count(*)::int
            from
                public.question_reports
            where
                report_text = 'bad question'), 1, 'report is not deleted');

select
    is ((
            select
                count(*)::int
            from
                public.question_bookmarks
            where
                user_id = :'gone'), 0, 'bookmarks are deleted');

select
    is ((
            select
                count(*)::int
            from
                public.users_social
            where
                user_id = :'gone'), 0, 'social links are deleted');

select
    is ((
            select
                count(*)::int
            from
                public.push_subscriptions
            where
                user_id = :'gone'), 0, 'push subscriptions are deleted');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'gone'), 0, 'mock and test sessions are deleted');

select
    is ((
            select
                user_id
            from
                public.donations
            where
                utr = 'DELETE-UTR-1'), null::uuid, 'donation record survives detached');

select
    is ((
            select
                count(*)::int
            from
                storage.objects
            where
                (storage.foldername (name))[1] = :'gone'), 0, 'avatar and banner objects are deleted');

select
    is ((
            select
                count(*)::int
            from
                auth.users
            where
                id = :'gone'), 0, 'auth user is deleted');

select
    *
from
    finish ();

rollback;
