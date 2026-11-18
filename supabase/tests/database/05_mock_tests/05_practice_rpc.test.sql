begin;
select
    plan (4);
\set user_free  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set user_donor 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set subject_id '11111111-1111-1111-1111-111111111111'
\set q_reg      '7e000000-0000-0000-0000-000000000001'
\set q_mock     '7e000000-0000-0000-0000-000000000002'
-- ─── Users ────────────────────────────────────────────────────────
insert into auth.users (id, email)
values
    (:'user_free', 'f@test.com'),
    (:'user_donor', 'd@test.com')
on conflict
    do nothing;
insert into public.users (id, username, name)
values
    (:'user_free', 'free', 'F'),
    (:'user_donor', 'donor', 'D')
on conflict
    do nothing;
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'user_free';
update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id = :'user_donor';
-- ─── Subject ──────────────────────────────────────────────────────
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'Test', 'test', false)
on conflict
    do nothing;
-- ─── Mock configuration ───────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values ('mock-rpc-test', 'RPC', 'cs', now() - interval '4 hours', 10800, 0, 1, 'live')
on conflict (id)
    do update set
        label = EXCLUDED.label,
        branch = EXCLUDED.branch,
        starts_at = EXCLUDED.starts_at,
        duration_seconds = EXCLUDED.duration_seconds,
        attempt_min_tier = EXCLUDED.attempt_min_tier,
        post_min_tier = EXCLUDED.post_min_tier,
        status = EXCLUDED.status;
-- ─── Questions ────────────────────────────────────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
values
    (:'q_reg', 2025, 1, 'Test', :'subject_id', 'Topic', 'multiple-choice', 'R?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English')),
    (:'q_mock', 2026, 1, 'Test', :'subject_id', 'Topic', 'multiple-choice', 'M?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- ─── Mock question relationship ───────────────────────────────────
insert into public.mock_questions (mock_id, question_id, position)
    values ('mock-rpc-test', :'q_mock', 1);
-- ─── Completed sessions ───────────────────────────────────────────
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
values
    (:'user_free', array['RPC'], 1, 0, 'completed', 1, 'cs', 'mock-rpc-test', false),
    (:'user_donor', array['RPC'], 1, 0, 'completed', 1, 'cs', 'mock-rpc-test', true);
-- ─── Tests start below ────────────────────────────────────────────
-- Test 1: Free user — the specific mock question is excluded
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    is ((
            select
                count(*)::int
            from
                public.fetch_practice_questions (:'subject_id'::uuid)
            where
                id = :'q_mock'::uuid), 0, 'free user RPC excludes the specific mock question');
-- Test 2: Free user — non-mock question still returned
select
    is ((
            select
                count(*)::int
            from
                public.fetch_practice_questions (:'subject_id'::uuid)
            where
                id = :'q_reg'::uuid), 1, 'free user RPC includes the specific non-mock question');
-- Test 3: Donor — mock question included
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is ((
            select
                count(*)::int
            from
                public.fetch_practice_questions (:'subject_id'::uuid)
            where
                id = :'q_mock'::uuid), 1, 'donor RPC includes the specific mock question');
-- Test 4: Delta sync — future last_fetched_at returns 0 for our fixtures
select
    is ((
            select
                count(*)::int
            from
                public.fetch_practice_questions (:'subject_id'::uuid, now() + interval '1 hour')
            where
                id in (:'q_reg'::uuid, :'q_mock'::uuid)),
            0,
            'delta sync with future last_fetched_at excludes our fixtures');
select
    *
from
    finish ();
rollback;

