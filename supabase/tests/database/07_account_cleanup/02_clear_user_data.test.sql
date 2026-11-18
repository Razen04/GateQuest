begin;
select
    plan (11);

\set cleaner   'b0000000-0000-4000-8000-000000000001'
\set question  'b0000000-0000-4000-8000-000000000002'
\set session   'b0000000-0000-4000-8000-000000000003'
\set revision  'b0000000-0000-4000-8000-000000000004'

-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
    values (:'cleaner', 'clear-me@test.com')
on conflict
    do nothing;

insert into public.users (id, username, name, version_number)
    values (:'cleaner', 'clearme', 'Clear Me', 1)
on conflict
    do nothing;

insert into public.questions (id, year, subject, question_type, question, correct_answer)
    values (:'question', 2026, 'QA', 'multiple-choice', 'Q?', '[0]'::jsonb)
on conflict
    do nothing;

insert into public.user_question_activity (user_id, question_id, branch_id, was_correct, attempt_number)
    values (:'cleaner', :'question', 'cs', true, 1);

insert into public.user_incorrect_queue (user_id, question_id, box)
    values (:'cleaner', :'question', 1);

insert into public.weekly_revision_set (id, generated_for, start_of_week)
    values (:'revision', :'cleaner', '2026-11-16'::date);

insert into public.revision_set_questions (set_id, question_id)
    values (:'revision', :'question');

insert into public.topic_tests (id, user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id)
    values (:'session', :'cleaner', array['QA'], 1, 100, 'completed', 1, 'cs');

-- ─── Five resets are allowed ──────────────────────────────────────
set local role authenticated;
select
    set_config('request.jwt.claim.sub', :'cleaner', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'cleaner', 'role', 'authenticated')::text, true);

select
    is ((public.clear_user_data () ->> 'version')::int, 2, 'first reset returns version 2');
select
    is ((public.clear_user_data () ->> 'version')::int, 3, 'second reset returns version 3');
select
    is ((public.clear_user_data () ->> 'version')::int, 4, 'third reset returns version 4');
select
    is ((public.clear_user_data () ->> 'version')::int, 5, 'fourth reset returns version 5');
select
    is ((public.clear_user_data () ->> 'version')::int, 6, 'fifth reset returns version 6');
select
    throws_ok ($$ select public.clear_user_data () $$, 'P0001', null, 'sixth reset is rejected');
reset role;

select
    is ((
            select
                version_number
            from
                public.users
            where
                id = :'cleaner'), 6, 'version_number ends at 6 after five resets');

select
    is ((
            select
                count(*)::int
            from
                public.topic_tests
            where
                user_id = :'cleaner'), 0, 'test sessions are cleared');

select
    is ((
            select
                count(*)::int
            from
                public.user_incorrect_queue
            where
                user_id = :'cleaner'), 0, 'incorrect queue is cleared');

select
    is ((
            select
                count(*)::int
            from
                public.weekly_revision_set
            where
                generated_for = :'cleaner'), 0, 'weekly revision sets and their questions are cleared');

select
    is ((
            select
                count(*)::int
            from
                public.user_question_activity
            where
                user_id = :'cleaner'), 1, 'question activity is kept for analytics');

select
    *
from
    finish ();

rollback;
