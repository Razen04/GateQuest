begin;
select plan(15); -- number of assertions to run

-- setup a isolated test user for this test session
insert into public.users (
    id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number
) values (
    '11111111-1111-1111-1111-111111111111'::uuid, 
    'test_pgtap@example.com', 
    'pgtap_test_user', 
    'test runner', 
    true, 
    true, 
    50, 
    2027, 
    1
);

insert into public.user_goals (user_id, branch_id, target_exams, is_active)
values ('11111111-1111-1111-1111-111111111111'::uuid, 'cs', '["gate"]'::jsonb, true);

-- ==============================
-- boundary tests
-- ==============================

-- test 1
select lives_ok(
    $$ select calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid) $$,
    'calc_user_metrics should execute cleanly without division by zero on fresh users'
);

-- test 2
select is(
    (calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid)->'streaks'->>'study_current')::int,
    0,
    'fresh user study current streak should be 0'
);

-- test 3
select throws_ok(
	    $$ select calc_user_metrics('99999999-9999-9999-9999-999999999999'::uuid) $$,
			'User not found.',
			'non-existing user_id should return profile not found.'
);

-- ==============================
-- calculation tests
-- ==============================

-- adding two attempts: 1 wrong, 2 correct 
insert into public.user_question_activity (
    user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number, user_version_number
) values 
('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now(), 1, 1),
('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', false, now(),  1, 1),
('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now(),  1, 1);

-- test 4
select is(
    (calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid)->'global_stats'->>'overall_accuracy')::int,
    67,
    'overall accuracy math should round 2/3 to 67%'
);

-- test 5
select is(
    (calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid)->'streaks'->>'study_current')::int,
		1,
		'multiple attempts on the same day should result in a 1-day streak'
);

-- for this isolated assertion, let's test a brand new user:
insert into public.users (id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number)
values ('22222222-2222-2222-2222-222222222222'::uuid, 'three_streak@example.com', 'three_day_user', '3 user', true, true, 0, 2027, 1);

insert into public.user_goals (user_id, branch_id, target_exams, is_active)
values ('22222222-2222-2222-2222-222222222222'::uuid, 'cs', '["gate"]'::jsonb, true);

-- add activity for today, yesterday and 2 days ago
insert into public.user_question_activity (
    user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number, user_version_number
) values 
('22222222-2222-2222-2222-222222222222'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now() - interval '2 days', 1, 1),
('22222222-2222-2222-2222-222222222222'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', false, now() - interval '1 day',  1, 1),
('22222222-2222-2222-2222-222222222222'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now(),                     1, 1);

-- test 6
select is(
    (calc_user_metrics('22222222-2222-2222-2222-222222222222'::uuid)->'streaks'->>'study_current')::int,
		3,
		'consecutive active today, yesterday and 2 days ago should result in 3 day streak'
);

-- test 7
select isnt(
    (calc_user_metrics('22222222-2222-2222-2222-222222222222'::uuid)->'dashboard_stats'->>'daily_question_target')::int,
    0,
    'daily_question_target should return the active daily goal target, not 0'
);

-- for this isolated assertion, let's test a brand new user who skipped yesterday:
insert into public.users (id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number)
values ('33333333-3333-3333-3333-333333333333'::uuid, 'broken_streak@example.com', 'gap_user', 'gap user', true, true, 0, 2027, 1);

insert into public.user_goals (user_id, branch_id, target_exams, is_active)
values ('33333333-3333-3333-3333-333333333333'::uuid, 'cs', '["gate"]'::jsonb, true);

-- practiced today and 3 days ago (gap in between)
insert into public.user_question_activity (user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number) values
('33333333-3333-3333-3333-333333333333'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true, now(), 1),
('33333333-3333-3333-3333-333333333333'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true, now() - interval '3 days', 1);

-- test 7 
select is(
    (calc_user_metrics('33333333-3333-3333-3333-333333333333'::uuid)->'streaks'->>'study_current')::int,
    1,
    'skipping days in between should reset the current streak back to 1'
);

-- ==============================
-- security, privacy and access control tests
-- ==============================

-- User A: Public Profile
insert into public.users (
    id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number
) values (
    '44444444-4444-4444-4444-444444444444'::uuid, 
    'public_user@example.com', 
    'public_coder', 
    'Public Coder', 
    true, 
    true, 
    100, 
    2027, 
    1
);

-- User B: Private Profile
insert into public.users (
    id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number
) values (
    '55555555-5555-5555-5555-555555555555'::uuid, 
    'private_user@example.com', 
    'incognito_coder', 
    'Private Coder', 
    false, 
    true, 
    500, 
    2027, 
    1
);


-- test 8
select is(
    (get_public_profile('public_coder')->'profile'->>'username'),
    'public_coder',
    'get_public_profile should return the correct profile username'
);

-- test 9
select is(
    (get_public_profile('pgtap_test_user')->'dashboard_stats'),
    null,
    'get_public_profile must strip out private dashboard_stats'
);

-- test 10
select throws_ok(
    $$ select get_public_profile('incognito_coder') $$,
    'This profile is private.',
    'get_public_profile should throw exception when profile is marked private'
);

-- test 11
set local role anon;

-- TODO: Update the policy to return an exception with code 42501 and then update this test
select is(
    (select count(*) from public.user_question_activity),
    0::bigint,
    'anonymous role should not see private user_question_activity rows'
);

reset role;

-- ==============================
-- state transitions and idempotency
-- ==============================

-- Setup: Create a clean user for State Transition testing
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

-- Insert Attempt 1 for a question 
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

-- test 12
select is(
    (calc_user_metrics('66666666-6666-6666-6666-666666666666'::uuid)->'global_stats'->>'total_attempts')::int,
    1,
    'first execution of calc_user_metrics should report 1 attempt'
);

-- test 13
select is(
    (calc_user_metrics('66666666-6666-6666-6666-666666666666'::uuid)->'global_stats'->>'total_attempts')::int,
    1,
    'second execution without data changes must return identical result (idempotent)'
);

-- Insert Attempt 2 (Correct answer on re-attempt)
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

-- test 14
select is(
    (calc_user_metrics('66666666-6666-6666-6666-666666666666'::uuid)->'global_stats'->>'overall_accuracy')::int,
    50,
    're-attempting a question should update overall accuracy to 50% (1/2 correct)'
);

-- cleanup
select * from finish();
rollback;
