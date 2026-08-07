\set ON_ERROR_STOP 1

begin;

select plan(4);

-- seed user a: public profile
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

-- seed user b: private profile
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

-- test 1: get public profile details
select is(
    (get_public_profile('public_coder')->'profile'->>'username'),
    'public_coder',
    'get_public_profile should return the correct profile username'
);

-- test 2: strip private dashboard stats from public profile
select is(
    (get_public_profile('public_coder')->'dashboard_stats'),
    null,
    'get_public_profile must strip out private dashboard_stats'
);

-- test 3: throw exception for private profiles
select throws_ok(
    $$ select get_public_profile('incognito_coder') $$,
    'This profile is private.',
    'get_public_profile should throw exception when profile is marked private'
);

-- test 4: anonymous role access check
set local role anon;

select is(
    (select count(*) from public.user_question_activity),
    0::bigint,
    'anonymous role should not see private user_question_activity rows'
);

reset role;

select * from finish();

rollback;
