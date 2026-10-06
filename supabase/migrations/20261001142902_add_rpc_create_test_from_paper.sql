-- p_branch: uppercase branch code from questions.metadata.set ('CS', 'DA')
-- p_branch_id: lowercase branch slug from branches.id ('cs', 'da')
-- These refer to the same concept but use different representations.
-- Unifying them requires a migration to normalize metadata.set.
create or replace function public.create_test_from_paper (p_paper_id text, p_paper_label text, p_year int, p_shift int, p_branch text, -- NEW
p_branch_id text, p_duration_seconds int, p_record_activity boolean default true)
    returns jsonb
    language plpgsql
    security definer
    set search_path to 'public'
    as $$
declare
    v_user_id uuid := auth.uid ();
    v_new_test_id uuid;
    v_existing_test_id uuid;
    v_actual_count int;
    v_total_marks int;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    -- Active test guard
    select
        id
    into
        v_existing_test_id
    from
        public.topic_tests
    where
        user_id = v_user_id
        and branch_id = p_branch_id
        and status != 'completed'
    limit 1;
    if v_existing_test_id is not null then
        return jsonb_build_object('error', 'An active test already exists for this branch', 'test_id', v_existing_test_id, 'status', 'active_exists');
    end if;
    create temp table temp_paper_questions on commit drop as
    select
        q.id, coalesce(q.marks, 1) as marks, case when q.metadata ->> 'section' = 'GA' then
            0
        else
            1
        end as section_order, q.question_number
    from
        public.questions q
    where
        q.verified = true
        and q.metadata ->> 'paperType' = 'official'
        and q.metadata ->> 'set' = p_branch
        and q.year = p_year
        and ((p_shift is null
                and q.metadata ->> 'shift' is null)
            or (p_shift is not null
                and (q.metadata ->> 'shift')::int = p_shift));
    select
        count(*),
        coalesce(sum(marks), 0)
    into
        v_actual_count,
        v_total_marks
    from
        temp_paper_questions;
    if v_actual_count = 0 then
        raise exception 'No questions found for this paper';
    end if;
    -- Create test session
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
        values (v_user_id, array[p_paper_label], v_actual_count, p_duration_seconds, 'created', v_total_marks, p_branch_id, p_paper_id, coalesce(p_record_activity, true))
    returning
        id
    into
        v_new_test_id;
    -- Insert attempts in paper order
    insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
    select
        v_new_test_id,
        id,
        row_number() over (order by section_order, question_number),
        'unvisited'
    from
        temp_paper_questions;
    return jsonb_build_object('test_id', v_new_test_id, 'actual_count', v_actual_count, 'total_marks', v_total_marks);
end;
$$;
