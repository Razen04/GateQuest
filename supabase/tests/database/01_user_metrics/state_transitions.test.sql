\set ON_ERROR_STOP 1

begin;

select plan(3);

-- setup clean user for state transition testing
insert into public.users (
    id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number
) values (
    '66666666-6666-6666-6666-666666666666'::uuid, 
    'state_test@example.com', 
    'state_coder', 
    'State Coder', 
    true, 
    true, 
    0, 
    2027, 
    1
);

-- attempt 1
insert into public.user_question_activity (
    user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number
) values (
    '66666666-6666-6666-6666-666666666666'::uuid, 
    'a0000000-0000-0000-0000-000000000014'::uuid, 
    '33333333-3333-3333-3333-333333333333'::uuid, 
    'cs', 
    false, 
    now() - interval '1 hour', 
    1
);

-- test 1: first attempt recorded
select is(
    (calc_user_metrics('66666666-6666-6666-6666-666666666666'::uuid)->'global_stats'->>'total_attempts')::int,
    1,
    'first execution of calc_user_metrics should report 1 attempt'
);

-- test 2: calculation idempotency
select is(
    (calc_user_metrics('66666666-6666-6666-6666-666666666666'::uuid)->'global_stats'->>'total_attempts')::int,
    1,
    'second execution without data changes must return identical result (idempotent)'
);

-- attempt 2 (re-attempt with correct answer)
insert into public.user_question_activity (
    user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number
) values (
    '66666666-6666-6666-6666-666666666666'::uuid, 
    'a0000000-0000-0000-0000-000000000014'::uuid, 
    '33333333-3333-3333-3333-333333333333'::uuid, 
    'cs', 
    true, 
    now(), 
    2
);

-- test 3: metrics updated after re-attempt
select is(
    (calc_user_metrics('66666666-6666-6666-6666-666666666666'::uuid)->'global_stats'->>'overall_accuracy')::int,
    50,
    're-attempting a question should update overall accuracy to 50% (1/2 correct)'
);

select * from finish();

rollback;
