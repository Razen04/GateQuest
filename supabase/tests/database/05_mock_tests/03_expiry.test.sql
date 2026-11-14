begin;
select
    plan (5);
\set participant   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set participant_2 'ffffffff-ffff-ffff-ffff-ffffffffffff'
\set session_stuck 'dddddddd-dddd-dddd-dddd-dddddddddddd'
\set session_live  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
\set subject_id    '11111111-1111-1111-1111-111111111111'
-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
values
    (:'participant', 'p@test.com'),
    (:'participant_2', 'p2@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, username, name)
values
    (:'participant', 'p', 'P'),
    (:'participant_2', 'p2', 'P2')
on conflict (id)
    do nothing;
update
    public.users
set
    notification_tags = array[]::text[]
where
    id in (:'participant', :'participant_2');
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'T', 't', false)
on conflict
    do nothing;
-- ─── Fixture: expired mock (window ended 1 hour ago) ─────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
select
    gen_random_uuid (),
    2026,
    n,
    'T',
    :'subject_id',
    'Topic',
    'multiple-choice',
    'Q' || n,
    array['A', 'B', 'C', 'D'],
    '[0]'::jsonb,
    1,
    'Easy',
    'E',
    'T',
    'test',
    true,
    jsonb_build_object('mockId', 'mock-exptest', 'mockLabel', 'Mock Exp', 'mockStartsAt', now() - interval '4 hours', 'mockDurationSeconds', 10800, 'mockAttemptMinTier', 0, 'mockPostMinTier', 1, 'set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English')
from
    generate_series(1, 2) n;
-- Stuck session — participant (ongoing, past window)
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
    values (:'session_stuck', :'participant', array['Mock Exp'], 2, 5000, 'ongoing', 2, 'cs', 'mock-exptest', false);
insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status, user_answer)
select
    :'session_stuck',
    id,
    row_number() over (),
    'answered',
    to_jsonb (0)
from
    public.questions
where
    metadata ->> 'mockId' = 'mock-exptest';
-- ─── Fixture: live mock (window still open) ──────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
select
    gen_random_uuid (),
    2026,
    n,
    'T',
    :'subject_id',
    'Topic',
    'multiple-choice',
    'Q' || n,
    array['A', 'B', 'C', 'D'],
    '[0]'::jsonb,
    1,
    'Easy',
    'E',
    'T',
    'test',
    true,
    jsonb_build_object('mockId', 'mock-livetest', 'mockLabel', 'Mock Live', 'mockStartsAt', now() - interval '30 min', 'mockDurationSeconds', 10800, 'mockAttemptMinTier', 0, 'mockPostMinTier', 1, 'set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English')
from
    generate_series(1, 2) n;
-- Live session — participant_2 (different user, same branch)
-- Same branch, different user → unique index allows it
insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
    values (:'session_live', :'participant_2', array['Mock Live'], 2, 8000, 'ongoing', 2, 'cs', 'mock-livetest', false);
-- ─── Tests ────────────────────────────────────────────────────────
-- Test 1: expire_mock_sessions completes only the stuck session
select
    is (public.expire_mock_sessions (),
        1,
        'expire_mock_sessions completes 1 stuck session');
-- Test 2: stuck session now completed
select
    is ((
            select
                status
            from
                public.topic_tests
            where
                id = :'session_stuck'), 'completed', 'stuck session status = completed');
-- Test 3: stuck session has score
select
    isnt ((
        select
            score
        from public.topic_tests
        where
            id = :'session_stuck'), null, 'stuck session score populated');
-- Test 4: live session untouched
select
    is ((
            select
                status
            from
                public.topic_tests
            where
                id = :'session_live'), 'ongoing', 'live session still ongoing');
-- Test 5: idempotent
select
    is (public.expire_mock_sessions (),
        0,
        'second call returns 0 (idempotent)');
select
    *
from
    finish ();
rollback;

