\set ON_ERROR_STOP 1

BEGIN;

SELECT plan(2);

-- CONSTANTS
\set TEST_USER '00000000-0000-0000-0000-000000000001'
\set SUB_1     '11111111-1111-1111-1111-111111111111'
\set SUB_2     '22222222-2222-2222-2222-222222222222'
\set CS_BRANCH 'cs'

-- Authenticate user
SELECT set_config('request.jwt.claim.sub', :'TEST_USER', true);

-- Cleanup state to ensure empty queue
TRUNCATE TABLE public.weekly_revision_set CASCADE;

DELETE FROM public.user_incorrect_queue 
WHERE user_id = :'TEST_USER'::uuid;

-- Test 1: returns empty
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
    ARRAY['empty'],
    'Returns status = "empty" when no eligible questions exist'
);

-- Test 2: does not create row
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
    ARRAY[0::bigint],
    'Does not create a weekly_revision_set row'
);

SELECT * FROM finish();

ROLLBACK;
