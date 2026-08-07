\set ON_ERROR_STOP 1

BEGIN;

SELECT plan(1);

-- CONSTANTS
\set SUB_1     '11111111-1111-1111-1111-111111111111'
\set SUB_2     '22222222-2222-2222-2222-222222222222'
\set CS_BRANCH 'cs'

-- Clear authentication claim
SELECT set_config('request.jwt.claim.sub', '', true);

-- Test: unauthenticated user fails
SELECT throws_ok(
    format(
        $$
        SELECT generate_weekly_revision_set(
            ARRAY[%L::uuid, %L::uuid],
            ARRAY['gate'],
            %L
        )
        $$,
        :'SUB_1',
        :'SUB_2',
        :'CS_BRANCH'
    ),
    'Failed to generate revision set: Not authenticated',
    'Unauthenticated users cannot generate a revision set'
);

SELECT * FROM finish();

ROLLBACK;
