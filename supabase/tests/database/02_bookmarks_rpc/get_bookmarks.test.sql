\set ON_ERROR_STOP 1

begin;

select plan(3);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set QUESTION_2 'a0000000-0000-0000-0000-000000000014'
\set QUESTION_3 'a0000000-0000-0000-0000-000000000016'

-- AUTHENTICATE AS TEST USER
select set_config(
    'request.jwt.claim.sub',
    :'TEST_USER',
    true
);

-- CLEANUP & SEED
delete from public.question_bookmarks where user_id = :'TEST_USER'::uuid;

select toggle_question_bookmark(:'QUESTION_2'::uuid);
select toggle_question_bookmark(:'QUESTION_3'::uuid);

-- Test 1: Fetch all bookmarks
select results_eq(
    $$
    select count(*)
    from get_user_bookmarks(null)
    $$,
    array[2::bigint],
    'Returns all bookmarked questions'
);

-- Test 2: Filter by subject
select results_eq(
    $$
    select question_id
    from get_user_bookmarks('dsa')
    $$,
    array[
        :'QUESTION_2'::uuid
    ],
    'Filters bookmarks by subject'
);

-- Test 3: Empty subject
select is_empty(
    $$
    select question_id
    from get_user_bookmarks('thermo')
    $$,
    'Returns empty result for subject with no bookmarks'
);

select * from finish();

rollback;
