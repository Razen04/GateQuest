\set ON_ERROR_STOP 1

begin;

select plan(4);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'

-- AUTHENTICATE AS TEST USER
select set_config(
    'request.jwt.claim.sub',
    :'TEST_USER',
    true
);

-- CLEANUP
delete from public.question_bookmarks where user_id = :'TEST_USER'::uuid;

-- Test 1: Creates bookmark and returns true
select is(
    toggle_question_bookmark(
        :'QUESTION_1'::uuid
    ),
    true,
    'toggle_question_bookmark() returns true when creating a bookmark'
);

-- Test 2: Bookmark row created in database
select results_eq(
    format(
        $$
        select question_id
        from public.question_bookmarks
        where user_id = %L
          and question_id = %L
        $$,
        :'TEST_USER',
        :'QUESTION_1'
    ),
    array[:'QUESTION_1'::uuid],
    'Bookmark row created'
);

-- Test 3: Removes bookmark and returns false
select is(
    toggle_question_bookmark(
        :'QUESTION_1'::uuid
    ),
    false,
    'toggle_question_bookmark() returns false when removing a bookmark'
);

-- Test 4: Bookmark row removed from database
select is_empty(
    format(
        $$
        select 1
        from public.question_bookmarks
        where user_id = %L
          and question_id = %L
        $$,
        :'TEST_USER',
        :'QUESTION_1'
    ),
    'Bookmark row removed'
);

select * from finish();

rollback;
