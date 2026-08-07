\set ON_ERROR_STOP 1

BEGIN;

SELECT plan(3);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'
\set SUB_1      '11111111-1111-1111-1111-111111111111'
\set SUB_2      '22222222-2222-2222-2222-222222222222'
\set CS_BRANCH  'cs'

-- Authenticate user
SELECT set_config('request.jwt.claim.sub', :'TEST_USER', true);

-- Cleanup
TRUNCATE TABLE public.weekly_revision_set CASCADE;

DELETE FROM public.user_incorrect_queue 
WHERE user_id = :'TEST_USER'::uuid;

-- Seed eligible incorrect question
INSERT INTO public.user_incorrect_queue (
    user_id,
    question_id,
    next_review_at,
    box
)
VALUES (
    :'TEST_USER'::uuid,
    :'QUESTION_1'::uuid,
    now(),
    1
);

-- Test 1: creates revision set (returns 'created' status)
SELECT results_eq(
    format(
        $$
        SELECT generate_weekly_revision_set(
            ARRAY[%L::uuid, %L::uuid],
            ARRAY['gate'],
            %L
        )->>'status'
        $$,
        :'SUB_1',
        :'SUB_2',
        :'CS_BRANCH'
    ),
    ARRAY['created'],
    'New revision set is successfully created.'
);

-- Test 2: creates questions (inserts row into database)
SELECT results_eq(
    format(
        $$
        SELECT count(*)
        FROM public.weekly_revision_set
        WHERE generated_for = %L::uuid
          AND branch_id = %L
        $$,
        :'TEST_USER',
        :'CS_BRANCH'
    ),
    ARRAY[1::bigint],
    'Successfully add a revision set.'
);

-- Test 3: total_questions matches
SELECT results_eq(
    format(
        $$
        SELECT total_questions::bigint
        FROM public.weekly_revision_set
        WHERE generated_for = %L::uuid
          AND branch_id = %L
        ORDER BY created_at DESC
        LIMIT 1
        $$,
        :'TEST_USER',
        :'CS_BRANCH'
    ),
    ARRAY[1::bigint],
    'Updates total_questions to match the inserted question count.'
);

SELECT * FROM finish();

ROLLBACK;
