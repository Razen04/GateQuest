\set ON_ERROR_STOP 1

begin;

select plan(4);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set QUESTION_2 'a0000000-0000-0000-0000-000000000014'

-- AUTHENTICATE AS TEST USER
select set_config(
    'request.jwt.claim.sub',
    :'TEST_USER',
    true
);

-- CLEANUP
delete from public.question_bookmarks where user_id = :'TEST_USER'::uuid;

-- Test 1: Create bookmark with notes
select is(
    toggle_question_bookmark(
        :'QUESTION_2'::uuid,
        'Revise algorithm efficiency later'
    ),
    true,
    'Bookmark with note created'
);

-- Test 2: Verify notes saved
select results_eq(
    format(
        $$
        select notes
        from public.question_bookmarks
        where user_id = %L
          and question_id = %L
        $$,
        :'TEST_USER',
        :'QUESTION_2'
    ),
    array['Revise algorithm efficiency later'::text],
    'Bookmark note saved'
);

-- Test 3: Update notes
select lives_ok(
    $$
    select update_question_bookmark_note(
        'a0000000-0000-0000-0000-000000000014',
        'Updated: High priority revision for GATE!'
    )
    $$,
    'update_question_bookmark_note() succeeds'
);

-- Test 4: Verify updated notes
select results_eq(
    format(
        $$
        select notes
        from public.question_bookmarks
        where user_id = %L
          and question_id = %L
        $$,
        :'TEST_USER',
        :'QUESTION_2'
    ),
    array['Updated: High priority revision for GATE!'::text],
    'Bookmark note updated'
);

select * from finish();

rollback;
