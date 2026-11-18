begin;
select
    plan (13);
-- Isolate from seed/other fixtures.
delete from public.topic_tests;

delete from public.user_question_activity;

delete from public.question_peer_stats;

delete from public.mocks;

\set donor    'd0000001-0000-4000-8000-000000000001'
\set free     'd0000002-0000-4000-8000-000000000002'
\set fallback 'd0000003-0000-4000-8000-000000000003'
\set subject  'c0000001-0000-4000-8000-000000000001'
\set q_mcq    'b0000001-0000-4000-8000-000000000001'
\set q_msq    'b0000002-0000-4000-8000-000000000002'
\set q_nat    'b0000003-0000-4000-8000-000000000003'
\set mock_closed 'mock-peer-closed'
\set mock_live   'mock-peer-live'
-- ─── Users ────────────────────────────────────────────────────────
insert into auth.users (id, email)
    values (:'donor', 'peer-donor@test.com'), (:'free', 'peer-free@test.com'), (:'fallback', 'peer-fallback@test.com')
on conflict
    do nothing;

insert into public.users (id, username, name)
    values (:'donor', 'peer-donor', 'Peer Donor'), (:'free', 'peer-free', 'Peer Free'), (:'fallback', 'peer-fallback', 'Peer Fallback')
on conflict
    do nothing;

update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id = :'donor';

update
    public.users
set
    notification_tags = array[]::text[]
where
    id in (:'free', :'fallback');

-- ─── Subject + questions ──────────────────────────────────────────
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject', 'Peer Stats', 'peer-stats', false)
on conflict
    do nothing;

insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'q_mcq', 2026, 1, 'Peer Stats', :'subject', 'T', 'multiple-choice', 'MCQ', array['A', 'B', 'C', 'D'], '[1]'::jsonb, 2, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'))), (:'q_msq', 2026, 2, 'Peer Stats', :'subject', 'T', 'multiple-select', 'MSQ', array['A', 'B', 'C', 'D'], '[0, 1]'::jsonb, 2, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'))), (:'q_nat', 2026, 3, 'Peer Stats', :'subject', 'T', 'numerical', 'NAT', array[]::text[], '{"type": "exact", "value": 42}'::jsonb, 2, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'paperType', 'mock', 'exam', jsonb_build_array('GATE')));

-- ─── Mocks + composition ──────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values (:'mock_closed', 'Closed Mock', 'cs', now() - interval '4 hours', 10800, 0, 0, 'live'), (:'mock_live', 'Live Mock', 'cs', now() - interval '1 hour', 10800, 0, 0, 'live');

insert into public.mock_questions (mock_id, question_id, position)
    values (:'mock_closed', :'q_mcq', 1), (:'mock_closed', :'q_msq', 2), (:'mock_closed', :'q_nat', 3), (:'mock_live', :'q_mcq', 1);

-- ─── Completed sessions ───────────────────────────────────────────
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity, completed_at)
    values
        -- Donor: closed mock
        ('a0000001-0000-4000-8000-000000000001', :'donor', array['Closed Mock'], 3, 0, 'completed', 6, 'cs', :'mock_closed', true, now() - interval '2 hours'),
        -- Free: closed mock
        ('a0000002-0000-4000-8000-000000000002', :'free', array['Closed Mock'], 3, 0, 'completed', 6, 'cs', :'mock_closed', false, now() - interval '2 hours'),
        -- Free: live mock (must not count)
        ('a0000003-0000-4000-8000-000000000003', :'free', array['Live Mock'], 1, 0, 'completed', 2, 'cs', :'mock_live', false, now() - interval '30 minutes'),
        -- Fallback user: closed mock, skipped q2
        ('a0000004-0000-4000-8000-000000000004', :'fallback', array['Closed Mock'], 2, 0, 'completed', 4, 'cs', :'mock_closed', false, now() - interval '2 hours'),
        -- Donor retry (later completion, must not count)
        ('a0000005-0000-4000-8000-000000000005', :'donor', array['Closed Mock'], 1, 0, 'completed', 2, 'cs', 'mock_closed-r2', true, now() - interval '1 hour'),
        -- Practice-from-mock session (must not count)
        ('a0000006-0000-4000-8000-000000000006', :'free', array['Closed Mock (Practice)'], 1, 0, 'completed', 2, 'cs', 'mock_closed-practice-123', true, now() - interval '1 hour');

insert into public.topic_tests_attempts (session_id, question_id, attempt_order, user_answer, is_correct, time_spent_seconds)
    values
        -- Donor closed mock
        ('a0000001-0000-4000-8000-000000000001', :'q_mcq', 1, '1'::jsonb, true, 100),
        ('a0000001-0000-4000-8000-000000000001', :'q_msq', 2, '[0, 1]'::jsonb, true, 120),
        ('a0000001-0000-4000-8000-000000000001', :'q_nat', 3, '41'::jsonb, false, 60),
        -- Free closed mock (q2 skipped)
        ('a0000002-0000-4000-8000-000000000002', :'q_mcq', 1, '0'::jsonb, false, 90),
        ('a0000002-0000-4000-8000-000000000002', :'q_msq', 2, null, null, 30),
        ('a0000002-0000-4000-8000-000000000002', :'q_nat', 3, '42'::jsonb, true, 70),
        -- Free live mock (excluded by embargo)
        ('a0000003-0000-4000-8000-000000000003', :'q_mcq', 1, '1'::jsonb, true, 80),
        -- Fallback user closed mock (q2 skipped)
        ('a0000004-0000-4000-8000-000000000004', :'q_mcq', 1, '0'::jsonb, false, 50),
        ('a0000004-0000-4000-8000-000000000004', :'q_msq', 2, null, null, 20),
        -- Donor retry on q1 (excluded: earliest completion wins)
        ('a0000005-0000-4000-8000-000000000005', :'q_mcq', 1, '0'::jsonb, false, 40),
        -- Practice-from-mock session (excluded)
        ('a0000006-0000-4000-8000-000000000006', :'q_nat', 1, '0'::jsonb, false, 30);

-- ─── Practice rows ───────────────────────────────────────────────
-- Donor practised the MCQ first, but the mock attempt must win.
insert into public.user_question_activity (user_id, question_id, subject, subject_id, branch_id, was_correct, time_taken, attempt_number, selected_option_indices)
    values (:'donor', :'q_mcq', 'Peer Stats', :'subject', 'cs', true, 55, 1, array[1]);

-- Fallback user skipped the MSQ in the mock, so the practice row fills in.
insert into public.user_question_activity (user_id, question_id, subject, subject_id, branch_id, was_correct, time_taken, attempt_number, selected_option_indices)
    values (:'fallback', :'q_msq', 'Peer Stats', :'subject', 'cs', false, 45, 1, array[2, 3]);

-- ─── Full refresh ─────────────────────────────────────────────────
select
    public.refresh_question_peer_stats ();

-- ─── MCQ: mock beats practice, live/retry excluded ────────────────
select
    is ((
            select
                total_attempts
            from
                public.question_peer_stats
            where
                question_id = :'q_mcq'), 3, 'mcq counts one contribution per user');

select
    is ((
            select
                correct_attempts
            from
                public.question_peer_stats
            where
                question_id = :'q_mcq'), 1, 'live mock attempt is excluded');

select
    is ((
            select
                option_distribution
            from
                public.question_peer_stats
            where
                question_id = :'q_mcq'), '{"0": 2, "1": 1}'::jsonb, 'mcq option distribution uses mock answers');

-- ─── MSQ: skipped mock falls back to practice ──────────────────────
select
    is ((
            select
                total_attempts
            from
                public.question_peer_stats
            where
                question_id = :'q_msq'), 2, 'skipped mock question falls back to practice');

select
    is ((
            select
                option_distribution
            from
                public.question_peer_stats
            where
                question_id = :'q_msq'), '{"0": 1, "1": 1, "2": 1, "3": 1}'::jsonb, 'msq distribution includes the practice selection');

-- ─── NAT: practice-from-mock session excluded ─────────────────────
select
    is ((
            select
                total_attempts
            from
                public.question_peer_stats
            where
                question_id = :'q_nat'), 2, 'practice-from-mock session is excluded');

select
    is ((
            select
                option_distribution
            from
                public.question_peer_stats
            where
                question_id = :'q_nat'), null, 'numerical question has no option distribution');

-- ─── Per-mock job ─────────────────────────────────────────────────
select
    is (public.refresh_closed_mock_stats (), 1, 'job refreshes only the closed mock');

select
    ok ((
            select
                peer_stats_refreshed_at is not null
            from
                public.mocks
            where
                id = :'mock_closed'), 'closed mock is stamped');

select
    is (public.refresh_closed_mock_stats (), 0, 'job is idempotent');

-- ─── Scoped refresh ───────────────────────────────────────────────
delete from public.question_peer_stats;

select
    public.refresh_question_peer_stats_for_questions (array[:'q_mcq']::uuid[]);

select
    ok (exists (
            select
                1
            from
                public.question_peer_stats
            where
                question_id = :'q_mcq'), 'scoped refresh writes the requested question');

select
    ok (not exists (
            select
                1
            from
                public.question_peer_stats
            where
                question_id = :'q_msq'), 'scoped refresh leaves other questions alone');

select
    public.refresh_question_peer_stats_for_questions ('{}'::uuid[]);

select
    is ((
            select
                count(*)::int
            from
                public.question_peer_stats), 1, 'empty question list is a no-op');

select
    *
from
    finish ();

rollback;
