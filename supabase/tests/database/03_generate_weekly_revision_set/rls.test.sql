\set ON_ERROR_STOP 1

begin;

select plan(5);

-- ---------------------------------------------------------------------------
-- CONSTANTS
-- ---------------------------------------------------------------------------
\set TEST_USER '00000000-0000-0000-0000-000000000001'
\set USER_2    '00000000-0000-0000-0000-000000000002'

\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'
\set SUB_1      '22222222-2222-2222-2222-222222222222'

\set CS_BRANCH 'cs'

truncate table public.weekly_revision_set cascade;

delete from public.user_incorrect_queue
where user_id in (:'TEST_USER'::uuid, :'USER_2'::uuid);

insert into public.user_incorrect_queue (
    user_id,
    question_id,
    next_review_at
)
values (
    :'TEST_USER'::uuid,
    :'QUESTION_1'::uuid,
    now()
);

-- ---------------------------------------------------------------------------
-- Test 1: unauthenticated users cannot call the RPC
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
    format(
        $$
        select generate_weekly_revision_set(
            array[%L::uuid],
            array['gate'],
            %L
        )
        $$,
        :'SUB_1',
        :'CS_BRANCH'
    ),
    'Failed to generate revision set: Not authenticated',
    'Rejects unauthenticated users'
);

-- ---------------------------------------------------------------------------
-- Authenticate
-- ---------------------------------------------------------------------------

select set_config(
    'request.jwt.claim.sub',
    :'TEST_USER',
    true
);

select generate_weekly_revision_set(
    array[:'SUB_1'::uuid],
    array['gate'],
    :'CS_BRANCH'
);

-- ---------------------------------------------------------------------------
-- Test 2: revision set belongs to authenticated user
-- ---------------------------------------------------------------------------

select results_eq(
$$
select generated_for
from public.weekly_revision_set
limit 1
$$,
array[:'TEST_USER'::uuid],
'Revision set is owned by authenticated user'
);

-- ---------------------------------------------------------------------------
-- Test 3: no revision set created for another user
-- ---------------------------------------------------------------------------
SELECT results_eq(
    format(
        $$
        SELECT count(*)
        FROM public.weekly_revision_set
        WHERE generated_for = %L::uuid
        $$,
        :'USER_2'
    ),
    ARRAY[0::bigint],
    'Does not create revision sets for another user'
);

-- ---------------------------------------------------------------------------
-- Test 4: revision questions belong to this user's revision set
-- ---------------------------------------------------------------------------

select results_eq(
$$
select count(*)
from public.revision_set_questions rsq
join public.weekly_revision_set wrs
on wrs.id = rsq.set_id
where wrs.generated_for = '00000000-0000-0000-0000-000000000001'::uuid
$$,
array[1::bigint],
'Revision questions belong to authenticated user'
);

-- ---------------------------------------------------------------------------
-- Test 5: no revision questions belong to another user
-- ---------------------------------------------------------------------------

select results_eq(
$$
select count(*)
from public.revision_set_questions rsq
join public.weekly_revision_set wrs
on wrs.id = rsq.set_id
where wrs.generated_for = '00000000-0000-0000-0000-000000000002'::uuid
$$,
array[0::bigint],
'No revision questions created for other users'
);

select * from finish();

rollback;
