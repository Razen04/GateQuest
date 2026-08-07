\set ON_ERROR_STOP 1

begin;

select plan(1);

-- CONSTANTS
\set TEST_USER '00000000-0000-0000-0000-000000000001'
\set USER_2    '00000000-0000-0000-0000-000000000002'
\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'

-- SEED BOOKMARK FOR TEST_USER
select set_config('request.jwt.claim.sub', :'TEST_USER', true);
delete from public.question_bookmarks where user_id = :'TEST_USER'::uuid;
select toggle_question_bookmark(:'QUESTION_1'::uuid);

-- SWITCH TO SECOND USER
select set_config('request.jwt.claim.sub', :'USER_2', true);

-- Test 1: RLS isolation
select is_empty(
    $$
    select question_id
    from get_user_bookmarks(null)
    $$,
    'Second user cannot see another user''s bookmarks'
);

select * from finish();

rollback;
