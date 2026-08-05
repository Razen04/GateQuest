\set ON_ERROR_STOP 1

begin;

select plan(3);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set USER_2     '00000000-0000-0000-0000-000000000002'

\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'
\set QUESTION_2 'a0000000-0000-0000-0000-000000000014'
\set QUESTION_3 'a0000000-0000-0000-0000-000000000016'

\set SUB_1 '11111111-1111-1111-1111-111111111111'
\set SUB_2 '22222222-2222-2222-2222-222222222222'
\set SUB_3 '33333333-3333-3333-3333-333333333333'

\set CS_BRANCH 'cs'

-- authentication needs to be cleared
select set_config(
    'request.jwt.claim.sub',
    '',
    true
);

-- test 1
select throws_ok(
    format(
        $$
        select generate_weekly_revision_set(
            array[%L::uuid, %L::uuid],
            array['gate'],
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

-- authentication
select set_config(
    'request.jwt.claim.sub',
    :'TEST_USER',
    true
);

-- Existing revision set
insert into public.weekly_revision_set (
    id,
    generated_for,
    branch_id,
    start_of_week,
    status,
    created_at,
    total_questions
)
values (
    gen_random_uuid(),
    :'TEST_USER',
    :'CS_BRANCH',
    (
        to_timestamp(
            floor(extract(epoch from current_date) / (3 * 86400)) * (3 * 86400)
        )::date
    ),
    'pending',
    now(),
    10
);

-- test 2: exisiting return
select results_eq(
    format(
        $$
        select generate_weekly_revision_set(
            array[%L::uuid, %L::uuid],
            array['gate'],
            %L
        )->>'status'
        $$,
        :'SUB_1',
        :'SUB_2',
        :'CS_BRANCH'
    ),
		array['existing'],
    'Test User already has an existing revision set'
);

-- test 3
select results_eq(
    format(
        $$
        select count(*)
        from weekly_revision_set
        where generated_for = %L
          and branch_id = %L
        $$,
        :'TEST_USER',
        :'CS_BRANCH'
    ),
    ARRAY[3::bigint], -- 2 from seed.sql
    'Does not create duplicate revision sets'
);


select * from finish();

rollback;
