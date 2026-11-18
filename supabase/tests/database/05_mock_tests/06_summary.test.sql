begin;
select
    plan (5);
\set user_free  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set user_donor 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
-- Unique subject + mock IDs per file
\set subject_id '6e6e6e6e-6e6e-6e6e-6e6e-6e6e6e6e6e6e'
\set mock_id    'mock-summary-test'
\set sess_free  'ee000000-0000-0000-0000-000000000001'
\set sess_donor 'ee000000-0000-0000-0000-000000000002'
-- ─── Users ────────────────────────────────────────────────────────
insert into auth.users (id, email)
values
    (:'user_free', 'sf@test.com'),
    (:'user_donor', 'sd@test.com')
on conflict
    do nothing;
insert into public.users (id, username, name)
values
    (:'user_free', 'sf', 'SF'),
    (:'user_donor', 'sd', 'SD')
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
    values (:'subject_id', 'Sum Test', 'sum-test', false)
on conflict
    do nothing;
-- ─── Mock configuration ───────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values (:'mock_id', 'Summary Test', 'cs', now() - interval '4 hours', 10800, 0, 1, 'live')
on conflict (id)
    do update set
        label = EXCLUDED.label,
        branch = EXCLUDED.branch,
        starts_at = EXCLUDED.starts_at,
        duration_seconds = EXCLUDED.duration_seconds,
        attempt_min_tier = EXCLUDED.attempt_min_tier,
        post_min_tier = EXCLUDED.post_min_tier,
        status = EXCLUDED.status;
-- ─── Mock questions ───────────────────────────────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
values
    ('ee000000-0000-0000-0000-000000000011', 2026, 1, 'Sum Test', :'subject_id', 'Topic', 'multiple-choice', 'Q?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 2, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English')),
    ('ee000000-0000-0000-0000-000000000012', 2026, 2, 'Sum Test', :'subject_id', 'Topic', 'multiple-choice', 'Q2?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 2, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- ─── Mock-question relationships ──────────────────────────────────
insert into public.mock_questions (mock_id, question_id, position)
values
    (:'mock_id', 'ee000000-0000-0000-0000-000000000011', 1),
    (:'mock_id', 'ee000000-0000-0000-0000-000000000012', 2);
-- ─── Completed sessions ───────────────────────────────────────────
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity, score, attempted_count)
values
    (:'sess_free', :'user_free', array['Summary Test'], 2, 0, 'completed', 4, 'cs', :'mock_id', false, 1, 2),
    (:'sess_donor', :'user_donor', array['Summary Test'], 2, 0, 'completed', 4, 'cs', :'mock_id', true, 1, 2);
-- ─── Attempt records ──────────────────────────────────────────────
insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status, score, is_correct)
select
    :'sess_free'::uuid,
    mq.question_id,
    mq.position,
    'answered',
    case when mq.position = 1 then
        2
    else
        -1
    end,
    mq.position = 1
from
    public.mock_questions mq
where
    mq.mock_id = :'mock_id'
union all
select
    :'sess_donor'::uuid,
    mq.question_id,
    mq.position,
    'answered',
    case when mq.position = 1 then
        2
    else
        -1
    end,
    mq.position = 1
from
    public.mock_questions mq
where
    mq.mock_id = :'mock_id';
-- ─── Tests start below ────────────────────────────────────────────
-- Test 1: Free user gets numbers + analysis_unlocked=false
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    is ((public.get_mock_summary (:'sess_free') ->> 'total_score')::numeric,
        1::numeric,
        'free user gets total_score');
-- Test 2: Free user positive/negative
select
    is ((public.get_mock_summary (:'sess_free') ->> 'positive_score')::numeric,
        2::numeric,
        'free user gets positive_score');
select
    is ((public.get_mock_summary (:'sess_free') ->> 'negative_score')::numeric,
        - 1::numeric,
        'free user gets negative_score');
-- Test 3: analysis_unlocked=false for free (post_min_tier=1)
select
    is ((public.get_mock_summary (:'sess_free') ->> 'analysis_unlocked')::boolean,
        false,
        'free user analysis_unlocked=false');
-- Test 4: Donor gets analysis_unlocked=true
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is ((public.get_mock_summary (:'sess_donor') ->> 'analysis_unlocked')::boolean,
        true,
        'donor analysis_unlocked=true');
select
    *
from
    finish ();
rollback;

