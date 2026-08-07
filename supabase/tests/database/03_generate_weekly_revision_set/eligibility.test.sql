\set ON_ERROR_STOP 1

BEGIN;

SELECT plan(6);

-- CONSTANTS
\set TEST_USER  '00000000-0000-0000-0000-000000000001'
\set QUESTION_1 'a0000000-0000-0000-0000-000000000001'
\set QUESTION_2 'a0000000-0000-0000-0000-000000000014'
\set QUESTION_3 'a0000000-0000-0000-0000-000000000016'
\set SUB_1      '11111111-1111-1111-1111-111111111111'
\set SUB_2      '22222222-2222-2222-2222-222222222222'
\set CS_BRANCH  'cs'

-- Authenticate user
SELECT set_config('request.jwt.claim.sub', :'TEST_USER', true);

-- Cleanup
TRUNCATE TABLE public.weekly_revision_set CASCADE;

DELETE FROM public.user_incorrect_queue 
WHERE user_id = :'TEST_USER'::uuid;

-- Seed questions with different eligibility attributes
-- Eligible: Due for review
INSERT INTO public.user_incorrect_queue (user_id, question_id, next_review_at, box)
VALUES (:'TEST_USER'::uuid, :'QUESTION_1'::uuid, now(), 1);

-- Ineligible: Future review date
INSERT INTO public.user_incorrect_queue (user_id, question_id, next_review_at, box)
VALUES (:'TEST_USER'::uuid, :'QUESTION_2'::uuid, current_date + 7, 1);

-- Ineligible: Different subject
INSERT INTO public.user_incorrect_queue (user_id, question_id, next_review_at, box)
VALUES (:'TEST_USER'::uuid, :'QUESTION_3'::uuid, current_date, 1);

-- Run generation
SELECT generate_weekly_revision_set(
    ARRAY[:'SUB_2'::uuid],
    ARRAY['gate'],
    :'CS_BRANCH'
);

-- Test 1: next_review_at filter (includes due questions)
SELECT results_eq(
    $$
    SELECT count(*)
    FROM public.revision_set_questions
    WHERE question_id = 'a0000000-0000-0000-0000-000000000001'::uuid
    $$,
    ARRAY[1::bigint],
    'Includes questions whose next_review_at is due'
);

-- Test 2: verified filter / future review filter (excludes future questions)
SELECT results_eq(
    $$
    SELECT count(*)
    FROM public.revision_set_questions
    WHERE question_id = 'a0000000-0000-0000-0000-000000000014'::uuid
    $$,
    ARRAY[0::bigint],
    'Excludes questions scheduled for future review'
);

-- Test 3: subject filter (includes supplied subject IDs)
SELECT results_eq(
    $$
    SELECT count(*)
    FROM public.revision_set_questions rsq
    JOIN public.questions q ON q.id = rsq.question_id
    WHERE rsq.question_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      AND q.subject_id = '22222222-2222-2222-2222-222222222222'::uuid
    $$,
    ARRAY[1::bigint],
    'Includes questions from supplied subject IDs'
);

-- Test 4: exam tags filter (excludes non-supplied subject IDs)
SELECT results_eq(
    $$
    SELECT count(*)
    FROM public.revision_set_questions rsq
    JOIN public.questions q ON q.id = rsq.question_id
		WHERE rsq.question_id = 'a0000000-0000-0000-0000-000000000001'::uuid
    	and q.subject_id = '11111111-1111-1111-1111-111111111111'::uuid
    $$,
    ARRAY[0::bigint],
    'Only includes supplied subject IDs'
);

-- Test 5: universal subjects filter
SELECT results_eq(
    $$
    SELECT count(*)
    FROM public.revision_set_questions rsq
    JOIN public.questions q ON q.id = rsq.question_id
    JOIN public.subjects s ON s.id = q.subject_id
    WHERE s.is_universal = true
    $$,
    ARRAY[1::bigint],
    'Includes universal subjects regardless of exam tags'
);

-- Test 6: branch filter
SELECT results_eq(
    $$
    SELECT count(*)
    FROM public.revision_set_questions rsq
    JOIN public.questions q ON q.id = rsq.question_id
    WHERE q.metadata->>'set' <> '1'
    $$,
    ARRAY[0::bigint],
    'Only includes questions for supplied branch'
);

SELECT * FROM finish();

ROLLBACK;
