create or replace function generate_topic_test (p_filters jsonb, p_question_count int, p_total_seconds int, p_already_attempted_questions boolean, p_branch_id text, p_record_activity boolean)
    returns jsonb
    language plpgsql
    security definer
    as $$
declare
    v_user_id uuid := auth.uid ();
    v_new_test_id uuid;
    v_existing_test_id uuid;
    v_actual_count int;
    v_total_marks int;
    v_topic_names text[];
    -- bucket sizes (50/30/20 rule)
    v_limit_new int := floor(p_question_count * 0.50);
    v_limit_rev int := floor(p_question_count * 0.30);
    v_limit_att int := p_question_count - (v_limit_new + v_limit_rev);
begin
    -- authentication check
    if v_user_id is null then
        raise exception 'not authenticated';
    end if;
    -- active test check
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
        return jsonb_build_object('error', 'an active test already exists for this branch', 'test_id', v_existing_test_id, 'status', 'active_exists');
    end if;
    -- extract topic names
    select
        array_agg(distinct topic)
    into
        v_topic_names
    from
        jsonb_to_recordset(p_filters) as f (topic text);
    -- question selection
    create temp table temp_selected_questions on commit drop as
    with filter_params as (
        select
            subject_id,
            topic
        from
            jsonb_to_recordset(p_filters) as f (subject_id uuid,
                topic text)
),
user_history as (
    select distinct
        question_id
    from
        public.user_question_activity
    where
        user_id = v_user_id
),
revision_queue as (
    select
        question_id
    from
        public.user_incorrect_queue
    where
        user_id = v_user_id
        and box = 1
),
pool as (
    select
        q.id,
        q.marks,
        q.subject_id,
        q.topic,
        (uh.question_id is not null) as is_attempted,
        (rq.question_id is not null) as is_revision
from
    public.questions q
    inner join filter_params fp on q.subject_id = fp.subject_id
        and q.topic = fp.topic
    left join user_history uh on q.id = uh.question_id
        left join revision_queue rq on q.id = rq.question_id
),
bucket_new as (
    select
        id,
        marks,
        1 as priority
    from
        pool
    where
        not is_attempted
    order by
        random()
    limit v_limit_new
),
bucket_rev as (
    select
        id,
        marks,
        2 as priority
    from
        pool
    where
        is_revision
        and id not in (
            select
                id
            from
                bucket_new)
        order by
            random()
        limit v_limit_rev
),
bucket_att as (
    select
        id,
        marks,
        3 as priority
    from
        pool
    where
        id not in (
            select
                id
            from
                bucket_new
            union
            select
                id
            from
                bucket_rev)
            and (p_already_attempted_questions
                or not is_attempted)
        order by
            random()
        limit p_question_count
)
select
    id, marks
from (
    select
        *
    from
        bucket_new
    union all
    select
        *
    from
        bucket_rev
    union all
    select
        *
    from
        bucket_att) combined
limit p_question_count;
    -- safety guard
    get diagnostics v_actual_count = row_count;
    if v_actual_count = 0 then
        raise exception 'no questions found matching these filters';
    end if;
    -- create test session
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, record_activity)
        values (v_user_id, v_topic_names, v_actual_count, (v_actual_count * 162), 'created', 0, p_branch_id, coalesce(p_record_activity, true))
    returning
        id
    into
        v_new_test_id;
    -- insert test questions
    insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
    select
        v_new_test_id,
        id,
        row_number() over (),
        'unvisited'
    from
        temp_selected_questions;
    -- calculate total marks
    select
        sum(marks)
    into
        v_total_marks
    from
        temp_selected_questions;
    update
        public.topic_tests
    set
        total_marks = v_total_marks
    where
        id = v_new_test_id;
    return jsonb_build_object('test_id', v_new_test_id, 'actual_count', v_actual_count, 'total_marks', v_total_marks);
end;
