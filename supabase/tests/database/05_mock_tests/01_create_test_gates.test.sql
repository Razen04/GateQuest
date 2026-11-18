begin;
select
    plan (10);
\set participant 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set subject_id  '11111111-1111-1111-1111-111111111111'
-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
    values (:'participant', 'p@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, username, name)
    values (:'participant', 'participant', 'P')
on conflict (id)
    do nothing;
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'participant';
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'T', 't', false)
on conflict
    do nothing;
create or replace function _insert_mock_questions (p_mock_id text, p_starts_at timestamptz, p_duration_sec int, p_attempt_min_tier int)
    returns void
    language plpgsql
    as $fn$
declare
    v_question_id uuid;
    v_position int := 0;
begin
    insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
        values (p_mock_id, p_mock_id, 'cs', p_starts_at, p_duration_sec, p_attempt_min_tier, 1, 'scheduled')
    on conflict (id)
        do update set
            starts_at = excluded.starts_at,
            duration_seconds = excluded.duration_seconds,
            attempt_min_tier = excluded.attempt_min_tier,
            status = excluded.status;
    for v_position in 1..3 loop
        v_question_id := gen_random_uuid ();
        insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
            values (v_question_id, 2026, v_position, 'T', '11111111-1111-1111-1111-111111111111', 'Topic', 'multiple-choice', 'Q' || v_position, array['A', 'B', 'C', 'D'], '[0]'::jsonb, 1, 'Easy', 'E', 'T', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
        insert into public.mock_questions (mock_id, question_id, position)
            values (p_mock_id, v_question_id, v_position);
    end loop;
end;
$fn$;
select
    _insert_mock_questions ('mock-upcoming', now() + interval '1 hour', 10800, 0);
select
    _insert_mock_questions ('mock-live-1', now() - interval '30 min', 10800, 0);
select
    _insert_mock_questions ('mock-live-2', now() - interval '30 min', 10800, 1);
-- FIX: start in the past so window is actually closing (ends ~30s from now)
select
    _insert_mock_questions ('mock-closing', now() - interval '3 hours' + interval '30 seconds', 10800, 0);
select
    _insert_mock_questions ('mock-expired', now() - interval '4 hours', 10800, 0);
-- ─── Test 1: not_live ─────────────────────────────────────────────
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
select
    is (public.create_test_from_mock ('mock-upcoming', 'cs') ->> 'status',
        'not_live',
        'upcoming mock returns not_live');
-- ─── Test 2: created ──────────────────────────────────────────────
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
delete from public.topic_tests_attempts
where session_id in (
        select
            id
        from
            public.topic_tests
        where
            user_id = :'participant');
delete from public.topic_tests
where user_id = :'participant';
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
select
    is (public.create_test_from_mock ('mock-live-1', 'cs') ->> 'status',
        'created',
        'live mock returns created');
-- ─── Test 3: already_attempted ────────────────────────────────────
select
    is (public.create_test_from_mock ('mock-live-1', 'cs') ->> 'status',
        'already_attempted',
        're-call returns already_attempted');
-- ─── Test 4: session_status in already_attempted payload ─────────
select
    is (public.create_test_from_mock ('mock-live-1', 'cs') ->> 'session_status',
        'created',
        'already_attempted includes session_status');
-- ─── Test 5: active_exists ────────────────────────────────────────
-- FIX: clean up mock-live-1 session BEFORE inserting the practice test,
-- otherwise the unique index rejects the second active session.
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
delete from public.topic_tests_attempts
where session_id in (
        select
            id
        from
            public.topic_tests
        where
            user_id = :'participant');
delete from public.topic_tests
where user_id = :'participant';
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
    values (:'participant', array['Practice'], 1, 3600, 'created', 1, 'cs', null, true);
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
select
    is (public.create_test_from_mock ('mock-expired', 'cs') ->> 'status',
        'active_exists',
        'open practice test blocks new mock attempt');
-- Cleanup practice test
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
delete from public.topic_tests_attempts
where session_id in (
        select
            id
        from
            public.topic_tests
        where
            user_id = :'participant');
delete from public.topic_tests
where user_id = :'participant';
-- ─── Test 6: re_attempt_gated (tier-0) ────────────────────────────
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
    values (:'participant', array['Mock'], 3, 0, 'completed', 3, 'cs', 'mock-live-1', false);
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
select
    is (public.create_test_from_mock ('mock-live-1', 'cs') ->> 'status',
        're_attempt_gated',
        'tier-0 re-attempt blocked');
-- ─── Test 7: created (donor re-attempt) ───────────────────────────
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
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
select
    is (public.create_test_from_mock ('mock-live-1', 'cs') ->> 'status',
        'created',
        'donor re-attempt returns created');
-- ─── Test 8: re-attempt paper_id is -r2 ──────────────────────────
-- FIX: use explicit participant UUID — current_setting is not reliable
-- after RESET role in pgTAP.
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
select
    is ((
            select
                paper_id
            from
                public.topic_tests
            where
                user_id = :'participant'::uuid
                and paper_id like 'mock-live-1-r%'
            order by
                created_at desc
            limit 1),
        'mock-live-1-r2',
        're-attempt paper_id is mock-live-1-r2');
-- ─── Test 9: attempt_gated ────────────────────────────────────────
delete from public.topic_tests_attempts
where session_id in (
        select
            id
        from
            public.topic_tests
        where
            user_id = :'participant');
delete from public.topic_tests
where user_id = :'participant';
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
select
    is (public.create_test_from_mock ('mock-live-2', 'cs') ->> 'status',
        'attempt_gated',
        'tier-0 user blocked from min_tier=1 mock');
-- ─── Test 10: window_closing ──────────────────────────────────────
select
    is (public.create_test_from_mock ('mock-closing', 'cs') ->> 'status',
        'window_closing',
        'sub-60s window returns window_closing');
select
    *
from
    finish ();
rollback;

