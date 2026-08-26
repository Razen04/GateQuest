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

