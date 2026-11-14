-- ═══════════════════════════════════════════════════════════════════
-- Mock access control
--
-- Verifies:
--   1. RLS blocks non-participants from reading mock questions
--   2. RLS preserves existing behavior for non-mock questions
--   3. user_has_question_in_session behaves correctly across session states
--   4. user_can_access_mock requires BOTH tier-1+ AND completed session
--   5. The two helpers are independent — RLS is more permissive than
--      the practice-flow helper (participants see questions during
--      the exam; only donors get practice integration)
--
-- Runs as authenticated role via SET LOCAL role + request.jwt.claim.sub.
-- pgTAP runs inside BEGIN/ROLLBACK; if any test fails, schema is
-- unchanged.
-- ═══════════════════════════════════════════════════════════════════
begin;
select
    plan (10);
-- ─── Fixtures ─────────────────────────────────────────────────────
\set participant 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set other_user  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set subject_id  '11111111-1111-1111-1111-111111111111'
\set mock1_q1    '99999999-0000-0000-0000-000000000001'
\set mock1_q2    '99999999-0000-0000-0000-000000000002'
\set mock2_q1    '99999999-1111-0000-0000-000000000001'
\set regular_q   '88888888-0000-0000-0000-000000000001'
insert into auth.users (id, email)
values
    (:'participant', 'participant@test.com'),
    (:'other_user', 'other@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, username, name)
values
    (:'participant', 'participant', 'Participant'),
    (:'other_user', 'other', 'Other User')
on conflict (id)
    do nothing;
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'Test Subject', 'test-subject', false)
on conflict (id)
    do nothing;
-- Mock 1: two questions
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
values
    (:'mock1_q1', 2026, 1, 'Test Subject', :'subject_id', 'Topic', 'multiple-choice', 'Mock Q1?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'Explanation', 'Test', 'test-user', true, jsonb_build_object('mockId', 'mock-test-01', 'mockLabel', 'Test Mock 1', 'mockStartsAt', '2026-12-07T09:30:00+05:30', 'mockDurationSeconds', 10800, 'mockAttemptMinTier', 0, 'mockPostMinTier', 1, 'set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English')),
    (:'mock1_q2', 2026, 2, 'Test Subject', :'subject_id', 'Topic', 'multiple-choice', 'Mock Q2?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'Explanation', 'Test', 'test-user', true, jsonb_build_object('mockId', 'mock-test-01', 'mockLabel', 'Test Mock 1', 'mockStartsAt', '2026-12-07T09:30:00+05:30', 'mockDurationSeconds', 10800, 'mockAttemptMinTier', 0, 'mockPostMinTier', 1, 'set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- Mock 2: one question (for cross-mock isolation test)
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'mock2_q1', 2026, 1, 'Test Subject', :'subject_id', 'Topic', 'multiple-choice', 'Mock 2 Q1?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'Explanation', 'Test', 'test-user', true, jsonb_build_object('mockId', 'mock-test-02', 'mockLabel', 'Test Mock 2', 'mockStartsAt', '2026-12-14T09:30:00+05:30', 'mockDurationSeconds', 10800, 'mockAttemptMinTier', 0, 'mockPostMinTier', 1, 'set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- Non-mock question (existing behavior preservation)
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values (:'regular_q', 2025, 1, 'Test Subject', :'subject_id', 'Topic', 'multiple-choice', 'Regular Q?', array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'Explanation', 'Test', 'test-user', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
-- ═══════════════════════════════════════════════════════════════════
-- Pre-session state
-- ═══════════════════════════════════════════════════════════════════
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'other_user', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'other_user', 'role', 'authenticated')::text, true);
-- Test 1 — user_has_question_in_session false for non-participant
select
    is (public.user_has_question_in_session (:'mock1_q1'::uuid),
        false,
        'non-participant has no session for mock-test-01 q1');
-- Test 2 — non-participant sees 0 mock questions via RLS
select
    results_eq ($$SELECT count(*)::int FROM public.questions WHERE metadata->>'mockId' = 'mock-test-01'$$, array[0], 'non-participant sees 0 mock-test-01 questions');
-- Test 3 — non-participant sees the specific non-mock fixture by id
-- (Broader non-mock visibility is intentional; asserting by id is
-- seed-data-independent and precisely targets the "existing behavior
-- preserved" invariant.)
select
    is ((
            select
                count(*)::int
            from
                public.questions
            where
                id = :'regular_q'::uuid), 1, 'non-participant sees the non-mock fixture question by id');
-- Test 4 — user_can_access_mock false for non-participant
select
    is (public.user_can_access_mock ('mock-test-01'),
        false,
        'non-participant cannot access mock-test-01 in flow');
-- ═══════════════════════════════════════════════════════════════════
-- Ongoing session (participant takes the mock)
-- ═══════════════════════════════════════════════════════════════════
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
    values ('66666666-0000-0000-0000-000000000001', :'participant', array['Test Mock 1'], 2, 10800, 'ongoing', 2, 'cs', 'mock-test-01', false);
insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
values
    ('66666666-0000-0000-0000-000000000001', :'mock1_q1', 1, 'answered'),
    ('66666666-0000-0000-0000-000000000001', :'mock1_q2', 2, 'unvisited');
-- Test 5 — user_has_question_in_session true during ongoing session
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
select
    is (public.user_has_question_in_session (:'mock1_q1'::uuid),
        true,
        'participant has session for mock-test-01 q1 (ongoing)');
-- Test 6 — participant sees their session's mock questions via RLS
select
    results_eq ($$SELECT count(*)::int FROM public.questions WHERE metadata->>'mockId' = 'mock-test-01'$$, array[2], 'participant sees 2 mock-test-01 questions during ongoing session');
-- Test 7 — participant CANNOT see a different mock's questions
select
    results_eq ($$SELECT count(*)::int FROM public.questions WHERE metadata->>'mockId' = 'mock-test-02'$$, array[0], 'participant cannot see mock-test-02 questions (no session)');
-- Test 8 — user_can_access_mock false when session is ongoing (needs completed)
select
    is (public.user_can_access_mock ('mock-test-01'),
        false,
        'ongoing session does not grant practice-flow access (must be completed)');
-- ═══════════════════════════════════════════════════════════════════
-- Completed session, tier-0 (user took mock before becoming a donor)
-- ═══════════════════════════════════════════════════════════════════
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
update
    public.topic_tests
set
    status = 'completed',
    score = 1
where
    id = '66666666-0000-0000-0000-000000000001';
-- Confirm participant has no donor tier tag
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'participant';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
-- Test 9 — tier-0 with completed session still cannot access in flow
select
    is (public.user_can_access_mock ('mock-test-01'),
        false,
        'tier-0 with completed session still cannot access in practice flow');
-- ═══════════════════════════════════════════════════════════════════
-- Completed session, tier-1+ (user is a donor)
-- ═══════════════════════════════════════════════════════════════════
reset role;
update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id = :'participant';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
-- Test 10 — tier-1+ with completed session can access
select
    is (public.user_can_access_mock ('mock-test-01'),
        true,
        'tier-1+ with completed session can access in practice flow');
select
    *
from
    finish ();
rollback;

