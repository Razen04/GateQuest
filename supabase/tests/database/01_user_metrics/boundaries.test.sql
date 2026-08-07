\set ON_ERROR_STOP 1

begin;

select plan(3);

-- setup isolated test user
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

-- test 1: zero division check on fresh user
select lives_ok(
    $$ select calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid) $$,
    'calc_user_metrics should execute cleanly without division by zero on fresh users'
);

-- test 2: initial streak check
select is(
    (calc_user_metrics('11111111-1111-1111-1111-111111111111'::uuid)->'streaks'->>'study_current')::int,
    0,
    'fresh user study current streak should be 0'
);

-- test 3: non-existent user handling
select throws_ok(
    $$ select calc_user_metrics('99999999-9999-9999-9999-999999999999'::uuid) $$,
    'User not found.',
    'non-existing user_id should return profile not found.'
);

select * from finish();

rollback;
