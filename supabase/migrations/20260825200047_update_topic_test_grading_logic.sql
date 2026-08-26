-- this addition allows students to take test freely without disturbing their dashboard data
alter table public.topic_tests
    add column record_activity boolean not null default true;

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
$$;

-- submit_test_grading removed insertion in user_question_activity as that is done by the trigger handle_test_completion_sync
create or replace function submit_test_grading (p_session_id uuid, p_payload jsonb, p_remaining_time_seconds int)
    returns jsonb
    language plpgsql
    security definer
    as $$
declare
    v_item jsonb;
    v_q_id uuid;
    v_user_ans jsonb;
    v_user_val float;
    v_correct_ans jsonb;
    v_ans_type text;
    v_q_marks float;
    v_q_type text;
    v_is_correct boolean;
    v_score float;
    v_total_score float := 0;
    v_correct_count int := 0;
    v_incorrect_count int := 0;
    v_attempted_count int := 0;
    -- context variables for user_question_activity
    v_user_id uuid;
    v_branch_id text;
    v_user_version int;
    v_subject_id uuid;
    v_subject_name text;
    v_record_activity boolean;
begin
    -- check if the session is already completed
    if exists (
        select
            1
        from
            topic_tests
        where
            id = p_session_id
            and status = 'completed') then
    return jsonb_build_object('status', 'already_completed');
end if;
    -- fetch user and session context
    select
        tt.user_id,
        tt.branch_id,
        tt.record_activity,
        u.version_number
    into
        v_user_id,
        v_branch_id,
        v_record_activity,
        v_user_version
    from
        topic_tests tt
        join users u on u.id = tt.user_id
    where
        tt.id = p_session_id;
    -- loop through the payload and grade each question
    for v_item in
    select
        *
    from
        jsonb_array_elements(p_payload)
        loop
            v_q_id := (v_item ->> 'question_id')::uuid;
            v_user_ans := v_item -> 'user_answer';
            -- fix literal 'null' text issue
            if jsonb_typeof(v_user_ans) = 'null' then
                v_user_ans := null;
            end if;
            -- fetch question details and subject name for activity logging
            select
                q.correct_answer,
                q.marks,
                q.question_type,
                q.subject_id,
                s.name
            into
                v_correct_ans,
                v_q_marks,
                v_q_type,
                v_subject_id,
                v_subject_name
            from
                questions q
                left join subjects s on s.id = q.subject_id
            where
                q.id = v_q_id;
            v_is_correct := null;
            v_score := 0;
            -- grading logic for attempted questions
            if v_user_ans is not null then
                v_attempted_count := v_attempted_count + 1;
                -- nat logic
                if v_q_type = 'numerical' then
                    v_user_val := (v_user_ans #>> '{}')::float;
                    v_ans_type := v_correct_ans ->> 'type';
                    case v_ans_type
                    when 'exact' then
                        v_is_correct := (v_user_val = (v_correct_ans ->> 'value')::float);
                    when 'multiple' then
                        v_is_correct := exists (
                            select
                                1
                            from
                                jsonb_array_elements(
                                    case when jsonb_typeof(v_correct_ans -> 'values') = 'array' then
                                        v_correct_ans -> 'values'
                                    else
                                        jsonb_build_array(v_correct_ans -> 'values')
                                    end) val
                            where (val #>> '{}')::float = v_user_val);
                    when 'range' then
                        if coalesce((v_correct_ans ->> 'inclusive')::boolean, true) then
                                v_is_correct := (v_user_val >= (v_correct_ans ->> 'min')::float
                                    and v_user_val <= (v_correct_ans ->> 'max')::float);
                    else
                        v_is_correct := (v_user_val > (v_correct_ans ->> 'min')::float
                                and v_user_val < (v_correct_ans ->> 'max')::float);
                            end if;
                    when 'tolerance' then
                        v_is_correct := (abs(v_user_val - (v_correct_ans ->> 'value')::float) <= (v_correct_ans ->> 'tolerance')::float);
                else
                    v_is_correct := false;
                    end case;
                    if v_is_correct then
                        v_score := coalesce(v_q_marks, 1);
                        v_correct_count := v_correct_count + 1;
                    else
                        v_incorrect_count := v_incorrect_count + 1;
                    end if;
                    -- mcq/msq logic
                else
                    if (
                        select
                            jsonb_agg(x order by x)
                        from
                            jsonb_array_elements(
                            case when jsonb_typeof(v_user_ans) = 'array' then
                                v_user_ans
                            else
                                jsonb_build_array(v_user_ans)
                            end) x) = (
                select
                    jsonb_agg(y order by y)
                from
                    jsonb_array_elements(
                        case when jsonb_typeof(v_correct_ans) = 'array' then
                            v_correct_ans
                        else
                            jsonb_build_array(v_correct_ans)
                        end) y) then
                v_is_correct := true;
                        v_score := coalesce(v_q_marks, 2);
                        v_correct_count := v_correct_count + 1;
                    else
                        v_is_correct := false;
                        if v_q_type = 'multiple-choice' then
                            v_score := - (coalesce(v_q_marks, 1) / 3.0);
                        end if;
                        v_incorrect_count := v_incorrect_count + 1;
                    end if;
                end if;
            end if;
            v_total_score := v_total_score + v_score;
            -- update topic_tests_attempts
            insert into topic_tests_attempts (session_id, question_id, user_answer, is_correct, score, time_spent_seconds, marked_for_review, status, attempt_order)
            values
                (p_session_id, v_q_id, v_user_ans, v_is_correct, v_score, (v_item ->> 'time_spent_seconds')::int, (v_item ->> 'marked_for_review')::boolean, coalesce(v_item ->> 'status', 'visited'),
                    (v_item ->> 'attempt_order')::int)
            on conflict (session_id, question_id)
                do update set
                    user_answer = excluded.user_answer,
                    is_correct = excluded.is_correct,
                    score = excluded.score,
                    time_spent_seconds = excluded.time_spent_seconds,
                    status = excluded.status;
        end loop;
    -- finalize topic test session
    update
        topic_tests
    set
        status = 'completed',
        score = v_total_score,
        correct_count = v_correct_count,
        attempted_count = v_attempted_count,
        remaining_time_seconds = p_remaining_time_seconds,
        completed_at = now(),
        accuracy = case when v_attempted_count > 0 then
            (v_correct_count::float / v_attempted_count::float) * 100
        else
            0
        end
    where
        id = p_session_id;
    return jsonb_build_object('total_score', v_total_score, 'correct_count', v_correct_count, 'incorrect_count', v_incorrect_count);
end;
$$;

-- handle test_completion_sync
create or replace function public.handle_test_completion_sync ()
    returns trigger
    language plpgsql
    security definer
    as $$
begin
    -- Only run when status changes to 'completed'
    if new.status = 'completed' and old.status <> 'completed' and new.record_activity is true then
        -- ACTIVITY LOG
        insert into public.user_question_activity (user_id, question_id, subject, subject_id, branch_id, user_version_number, was_correct, time_taken, attempted_at, attempt_number)
        select
            new.user_id,
            a.question_id,
            q.subject,
            q.subject_id,
            new.branch_id,
            (
                select
                    version_number
                from
                    public.users
                where
                    id = new.user_id), a.is_correct, a.time_spent_seconds, NOW(), (
                select
                    COALESCE(MAX(attempt_number), 0) + 1
                from
                    public.user_question_activity uqa
                where
                    uqa.user_id = new.user_id
                    and uqa.question_id = a.question_id)
        from
            public.topic_tests_attempts a
            join public.questions q on q.id = a.question_id
        where
            a.session_id = new.id
            and a.user_answer is not null;
        -- INCORRECT ANSWERS
        insert into public.user_incorrect_queue (user_id, question_id, box, added_at, next_review_at)
        select
            new.user_id,
            a.question_id,
            1,
            NOW(),
            NOW()
        from
            public.topic_tests_attempts a
        where
            a.session_id = new.id
            and COALESCE(a.is_correct, false) = false
        on conflict (user_id,
            question_id)
            do update set
                box = 1,
                next_review_at = NOW() + interval '1 week';
        -- CORRECT ANSWERS → GRADUATE
        -- Graduate box 3
        delete from public.user_incorrect_queue q using public.topic_tests_attempts a
        where q.user_id = new.user_id
            and q.question_id = a.question_id
            and a.session_id = new.id
            and a.is_correct is true
            and q.box = 3;
    -- Promote box 1 → 2, box 2 → 3
    update
        public.user_incorrect_queue q
    set
        box = q.box + 1,
        next_review_at = case when q.box = 1 then
            NOW() + interval '2 weeks'
        when q.box = 2 then
            NOW() + interval '4 weeks'
        else
            q.next_review_at
        end
    from
        public.topic_tests_attempts a
    where
        q.user_id = new.user_id
        and q.question_id = a.question_id
        and a.session_id = new.id
        and a.is_correct is true
        and q.box in (1, 2);
end if;
    return NEW;
end;
$$;
