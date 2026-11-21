begin;
select
    plan (3);
\set user_1    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'
\set subject_id '8e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e'
\set mock_id    'mock-lb-test'
\set question_id '8e000000-0000-0000-0000-000000000001'
-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
    values (:'user_1', 'lb@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, username, name)
    values (:'user_1', 'lb', 'LB')
on conflict (id)
    do nothing;
update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id = :'user_1';
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'LB Test', 'lb-test', false)
on conflict (id)
    do nothing;
-- Mock configuration
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values (:'mock_id', 'LB Test', 'cs', now() - interval '4 hours', 10800, 0, 1, 'live');
-- Regular question: no mock-specific metadata
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'question_id', 2026, 1, 'LB Test', :'subject_id', 'T', 'multiple-choice', 'Q?', array['A'], '[0]'::jsonb, 1, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- Associate question with mock
insert into public.mock_questions (mock_id, question_id, position)
    values (:'mock_id', :'question_id', 1);
-- Completed donor session
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity, score)
    values (:'user_1', array['X'], 1, 5000, 'completed', 1, 'cs', :'mock_id', true, 75);
-- Test 1: leaderboard top has our user
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_1', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_1', 'role', 'authenticated')::text, true);
select
    is (jsonb_array_length(public.get_mock_leaderboard (:'mock_id') -> 'top'),
        1,
        'leaderboard has 1 entry');
-- Test 2: my_rank is 1
select
    is ((public.get_mock_leaderboard (:'mock_id') ->> 'my_rank')::int,
        1,
        'my_rank is 1');
-- Test 3: free user gets tier_required
reset role;
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'user_1';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_1', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_1', 'role', 'authenticated')::text, true);
select
    is (public.get_mock_leaderboard (:'mock_id') ->> 'error',
        'tier_required',
        'free user gets tier_required');
select
    *
from
    finish ();
rollback;

