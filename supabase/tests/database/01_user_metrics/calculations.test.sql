\set ON_ERROR_STOP 1

begin;

select plan(5);

-- setup primary test user
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

-- seed question attempts (1 wrong, 2 correct)
insert into public.user_question_activity (
    user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number, user_version_number
) values 
('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now(), 1, 1),
('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', false, now(), 1, 1),
('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now(), 1, 1);

-- test 1: accuracy rounding
select is(
    (calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid)->'global_stats'->>'overall_accuracy')::int,
    67,
    'overall accuracy math should round 2/3 to 67%'
);

-- test 2: same-day multiple attempts streak
select is(
    (calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid)->'streaks'->>'study_current')::int,
    1,
    'multiple attempts on the same day should result in a 1-day streak'
);

-- setup user with 3 consecutive active days
insert into public.users (id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number)
values ('22222222-2222-2222-2222-222222222222'::uuid, 'three_streak@example.com', 'three_day_user', '3 user', true, true, 0, 2027, 1);

insert into public.user_goals (user_id, branch_id, target_exams, is_active)
values ('22222222-2222-2222-2222-222222222222'::uuid, 'cs', '["gate"]'::jsonb, true);

insert into public.user_question_activity (
    user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number, user_version_number
) values 
('22222222-2222-2222-2222-222222222222'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now() - interval '2 days', 1, 1),
('22222222-2222-2222-2222-222222222222'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', false, now() - interval '1 day',  1, 1),
('22222222-2222-2222-2222-222222222222'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true,  now(),                     1, 1);

-- test 3: multi-day streak calculation & target verification
select is(
    (calc_user_metrics('22222222-2222-2222-2222-222222222222'::uuid)->'streaks'->>'study_current')::int,
    3,
    'consecutive active today, yesterday and 2 days ago should result in 3 day streak'
);

-- test 4
select isnt(
    (calc_user_metrics('22222222-2222-2222-2222-222222222222'::uuid)->'dashboard_stats'->>'daily_question_target')::int,
    0,
    'daily_question_target should return the active daily goal target, not 0'
);

-- setup user with a gap in activity
insert into public.users (id, email, username, name, is_public, show_name, total_xp, "targetYear", version_number)
values ('33333333-3333-3333-3333-333333333333'::uuid, 'broken_streak@example.com', 'gap_user', 'gap user', true, true, 0, 2027, 1);

insert into public.user_goals (user_id, branch_id, target_exams, is_active)
values ('33333333-3333-3333-3333-333333333333'::uuid, 'cs', '["gate"]'::jsonb, true);

insert into public.user_question_activity (user_id, question_id, subject_id, branch_id, was_correct, attempted_at, attempt_number) values
('33333333-3333-3333-3333-333333333333'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true, now(), 1),
('33333333-3333-3333-3333-333333333333'::uuid, 'a0000000-0000-0000-0000-000000000014'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cs', true, now() - interval '3 days', 1);

-- test 5: gap resets streak
select is(
    (calc_user_metrics('33333333-3333-3333-3333-333333333333'::uuid)->'streaks'->>'study_current')::int,
    1,
    'skipping days in between should reset the current streak back to 1'
);

select * from finish();

rollback;
