\set ON_ERROR_STOP 1

begin;

select plan(12);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set USER_2     '00000000-0000-0000-0000-000000000002'

\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'
\set QUESTION_2 'a0000000-0000-0000-0000-000000000014'
\set QUESTION_3 'a0000000-0000-0000-0000-000000000016'

-- AUTHENTICATE AS TEST USER
select set_config(
    'request.jwt.claim.sub',
    :'TEST_USER',
    true
);

-- toggle_question_bookmark()
-- Test 1: Creates bookmark and returns TRUE
select is(
    toggle_question_bookmark(
        :'QUESTION_1'::uuid
    ),
    true,
    'toggle_question_bookmark() returns TRUE when creating a bookmark'
);

-- Test 2: Bookmark exists
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
    ARRAY[:'QUESTION_1'::uuid],
    'Bookmark row created'
);

-- Test 3: Removes bookmark and returns FALSE
select is(
    toggle_question_bookmark(
        :'QUESTION_1'::uuid
    ),
    false,
    'toggle_question_bookmark() returns FALSE when removing a bookmark'
);

-- Test 4: Bookmark removed
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

-- Notes
-- Test 5: Create bookmark with notes
select is(
    toggle_question_bookmark(
        :'QUESTION_2'::uuid,
        'Revise algorithm efficiency later'
    ),
    true,
    'Bookmark with note created'
);

-- Test 6: Verify notes saved
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
    ARRAY['Revise algorithm efficiency later'::text],
    'Bookmark note saved'
);

-- Test 7: Update notes
select lives_ok(
    $$
    select update_question_bookmark_note(
        'a0000000-0000-0000-0000-000000000014',
        'Updated: High priority revision for GATE!'
    )
    $$,
    'update_question_bookmark_note() succeeds'
);

-- Test 8: Verify updated notes
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
    ARRAY['Updated: High priority revision for GATE!'::text],
    'Bookmark note updated'
);

-- get_user_bookmarks()
-- Add another bookmark
select toggle_question_bookmark(
    :'QUESTION_3'::uuid
);

-- Test 9: Fetch all bookmarks
select results_eq(
    $$
    select count(*)
    from get_user_bookmarks(null)
    $$,
    ARRAY[2::bigint],
    'Returns all bookmarked questions'
);

-- Test 10: Filter by subject
select results_eq(
    $$
    select question_id
    from get_user_bookmarks('dsa')
    $$,
    ARRAY[
        :'QUESTION_2'::uuid
    ],
    'Filters bookmarks by subject'
);

-- Test 11: Empty subject
select is_empty(
    $$
    select question_id
    from get_user_bookmarks('thermo')
    $$,
    'Returns empty result for subject with no bookmarks'
);

-- RLS
select set_config(
    'request.jwt.claim.sub',
    :'USER_2',
    true
);

-- Test 12
select is_empty(
    $$
    select question_id
    from get_user_bookmarks(null)
    $$,
    'Second user cannot see another user''s bookmarks'
);

select * from finish();

rollback;
