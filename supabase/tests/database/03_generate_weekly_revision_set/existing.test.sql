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

-- Cleanup
TRUNCATE TABLE public.weekly_revision_set CASCADE;

-- Seed an existing pending revision set
INSERT INTO public.weekly_revision_set (
    id,
    generated_for,
    branch_id,
    start_of_week,
    status,
    created_at,
    total_questions
)
VALUES (
    gen_random_uuid(),
    :'TEST_USER',
    :'CS_BRANCH',
    (to_timestamp(floor(extract(epoch FROM current_date) / (3 * 86400)) * (3 * 86400))::date),
    'pending',
    now(),
    10
);

-- Test 1: returns existing
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
    ARRAY['existing'],
    'Test User already has an existing revision set'
);

-- Test 2: does not duplicate
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
    'Does not create duplicate revision sets'
);

SELECT * FROM finish();

ROLLBACK;
