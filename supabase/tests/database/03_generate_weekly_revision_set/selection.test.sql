\set ON_ERROR_STOP 1

begin;

select plan(2);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'
\set QUESTION_2 'a0000000-0000-0000-0000-000000000002'
\set QUESTION_3 'a0000000-0000-0000-0000-000000000003'
\set SUB_1      '11111111-1111-1111-1111-111111111111'
\set SUB_2      '22222222-2222-2222-2222-222222222222'
\set SUB_3      '33333333-3333-3333-3333-333333333333'
\set CS_BRANCH  'cs'

-- Authenticate user
select set_config('request.jwt.claim.sub', :'TEST_USER', true);

-- Cleanup
truncate table public.weekly_revision_set cascade;

delete from public.user_incorrect_queue
where user_id = :'TEST_USER'::uuid;

-- ----------------------------------------------------------------------------
-- Part 1: Box Ordering & Added At Ordering
-- ----------------------------------------------------------------------------
insert into public.user_incorrect_queue (user_id, question_id, box, added_at, next_review_at)
values
    (:'TEST_USER'::uuid, :'QUESTION_1'::uuid, 3, now() - interval '3 days', current_date),
    (:'TEST_USER'::uuid, :'QUESTION_2'::uuid, 1, now() - interval '2 days', current_date),
    (:'TEST_USER'::uuid, :'QUESTION_3'::uuid, 2, now() - interval '1 day', current_date);

select generate_weekly_revision_set(
    array[:'SUB_1'::uuid, :'SUB_2'::uuid, :'SUB_3'::uuid],
    array['gate'],
    :'CS_BRANCH'
);

-- Reset for added_at testing
truncate table public.weekly_revision_set cascade;

delete from public.user_incorrect_queue
where user_id = :'TEST_USER'::uuid;

insert into public.user_incorrect_queue (user_id, question_id, box, added_at, next_review_at)
values
    (:'TEST_USER'::uuid, :'QUESTION_1'::uuid, 1, now() - interval '10 days', current_date),
    (:'TEST_USER'::uuid, :'QUESTION_2'::uuid, 1, now() - interval '5 days', current_date);

select generate_weekly_revision_set(
    array[:'SUB_1'::uuid, :'SUB_2'::uuid],
    array['gate'],
    :'CS_BRANCH'
);

-- Test 1: all eligible questions
select results_eq(
    $$
    select question_id
    from public.revision_set_questions
    order by question_id
    $$,
    array[
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'a0000000-0000-0000-0000-000000000002'::uuid
    ],
    'Selects all eligible questions'
);

-- ----------------------------------------------------------------------------
-- Part 2: No Duplicates
-- ----------------------------------------------------------------------------
truncate table public.weekly_revision_set cascade;

delete from public.user_incorrect_queue
where user_id = :'TEST_USER'::uuid;

insert into public.user_incorrect_queue (user_id, question_id, box, added_at, next_review_at)
values
    (:'TEST_USER'::uuid, :'QUESTION_1'::uuid, 1, now() - interval '10 days', current_date),
    (:'TEST_USER'::uuid, :'QUESTION_2'::uuid, 1, now() - interval '5 days', current_date);

select generate_weekly_revision_set(
    array[:'SUB_1'::uuid],
    array['gate'],
    :'CS_BRANCH'
);

-- Test 2: no duplicates
select results_eq(
    $$
    select count(*)
    from (
        select question_id, count(*)
        from public.revision_set_questions
        group by question_id
        having count(*) > 1
    ) duplicates
    $$,
    array[0::bigint],
    'Does not insert duplicate question IDs'
);

select * from finish();

rollback;
