begin;
select
    plan (4);
\set user_donor 'cccccccc-cccc-cccc-cccc-cccccccccccc'
\set user_other 'dddddddd-dddd-dddd-dddd-dddddddddddd'
\set subject_id '7e7e7e7e-7e7e-7e7e-7e7e-7e7e7e7e7e7e'
\set mock_id    'mock-analysis-test'
\set sess_donor 'ff000000-0000-0000-0000-000000000001'
\set sess_other 'ff000000-0000-0000-0000-000000000002'
\set mock_q     'ff000000-0000-0000-0000-000000000011'
-- ─── Users ────────────────────────────────────────────────────────
insert into auth.users (id, email)
values
    (:'user_donor', 'ad@test.com'),
    (:'user_other', 'ao@test.com')
on conflict
    do nothing;
insert into public.users (id, username, name)
values
    (:'user_donor', 'ad', 'AD'),
    (:'user_other', 'ao', 'AO')
on conflict
    do nothing;
update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id in (:'user_donor', :'user_other');
-- ─── Subject ──────────────────────────────────────────────────────
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'Ana Test', 'ana-test', false)
on conflict
    do nothing;
-- ─── Mock configuration ───────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values (:'mock_id', 'Analysis Test', 'cs', now() - interval '4 hours', 10800, 0, 1, 'live')
on conflict (id)
    do update set
        label = EXCLUDED.label,
        branch = EXCLUDED.branch,
        starts_at = EXCLUDED.starts_at,
        duration_seconds = EXCLUDED.duration_seconds,
        attempt_min_tier = EXCLUDED.attempt_min_tier,
        post_min_tier = EXCLUDED.post_min_tier,
        status = EXCLUDED.status;
-- ─── Mock question ────────────────────────────────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'mock_q', 2026, 1, 'Ana Test', :'subject_id', 'T', 'multiple-choice', 'Q?', array['A'], '[0]'::jsonb, 1, 'Easy', 'E', 'Test', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- ─── Mock-question relationship ───────────────────────────────────
insert into public.mock_questions (mock_id, question_id, position)
    values (:'mock_id', :'mock_q', 1);
-- ─── Completed sessions ───────────────────────────────────────────
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity, score, completed_at)
values
    (:'sess_donor', :'user_donor', array['X'], 1, 3000, 'completed', 1, 'cs', :'mock_id', true, 50, now() - interval '2 hours'),
    (:'sess_other', :'user_other', array['X'], 1, 1000, 'completed', 1, 'cs', :'mock_id', true, 80, now() - interval '2 hours');
-- Test 1: donor gets rank 2 (lower score)
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is ((public.get_mock_analysis (:'sess_donor') ->> 'rank')::int,
        2,
        'donor rank = 2 (lower score than other)');
-- Test 2: total_participants = 2
select
    is ((public.get_mock_analysis (:'sess_donor') ->> 'total_participants')::int,
        2,
        'total participants = 2');
-- Test 3: other user rank 1
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_other', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_other', 'role', 'authenticated')::text, true);
select
    is ((public.get_mock_analysis (:'sess_other') ->> 'rank')::int,
        1,
        'other user rank = 1');
-- Test 4: free user gets tier_required
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
-- Update BEFORE switching to authenticated. Phase 1's lockdown revoked
-- UPDATE on public.users from authenticated/anon, so this must run as
-- postgres (RESET role already did that).
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'user_donor';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is (public.get_mock_analysis (:'sess_donor') ->> 'error',
        'tier_required',
        'free user gets tier_required');
select
    *
from
    finish ();
rollback;

