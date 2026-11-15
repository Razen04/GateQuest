create or replace function public.create_test_from_mock (p_mock_id text, p_branch_id text, p_record_activity boolean default false)
    returns jsonb
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_user_id uuid := auth.uid ();
    v_my_tier smallint;
    v_new_test_id uuid;
    v_existing_test_id uuid;
    v_existing_status text;
    v_blocking_test_id uuid;
    v_blocking_paper text;
    v_starts_at timestamptz;
    v_ends_at timestamptz;
    v_duration_seconds int;
    v_attempt_min_tier smallint;
    v_label text;
    v_time_allowed int;
    v_actual_count int;
    v_total_marks int;
    v_record_activity boolean;
    v_is_re_attempt boolean := false;
    v_attempt_number int;
    v_new_paper_id text;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    v_my_tier := public.get_my_tier ();
    select
        min((q.metadata ->> 'mockStartsAt')::timestamptz),
        max((q.metadata ->> 'mockDurationSeconds')::int),
        max(coalesce((q.metadata ->> 'mockAttemptMinTier')::smallint, 0)),
        max(q.metadata ->> 'mockLabel'),
        count(*),
        sum(coalesce(q.marks, 1))
    into
        v_starts_at,
        v_duration_seconds,
        v_attempt_min_tier,
        v_label,
        v_actual_count,
        v_total_marks
    from
        public.questions q
    where
        q.metadata ->> 'mockId' = p_mock_id
        and upper(q.metadata ->> 'set') = upper(p_branch_id);
    if coalesce(v_actual_count, 0) = 0 then
        raise exception 'Unknown mock % for branch %', p_mock_id, p_branch_id;
    end if;
    if v_starts_at is null or v_duration_seconds is null then
        raise exception 'Mock % missing mockStartsAt or mockDurationSeconds', p_mock_id;
    end if;
    v_ends_at := v_starts_at + make_interval(secs => v_duration_seconds);
    select
        id,
        status
    into
        v_existing_test_id,
        v_existing_status
    from
        public.topic_tests
    where
        user_id = v_user_id
        and (paper_id = p_mock_id
            or paper_id like p_mock_id || '-r%')
    order by
        created_at desc
    limit 1;
    if v_existing_test_id is not null then
        if v_existing_status = 'completed' then
            if v_my_tier < 1 then
                return jsonb_build_object('status', 're_attempt_gated', 'test_id', v_existing_test_id, 'min_tier', 1);
            end if;
            v_is_re_attempt := true;
            select
                count(*)
            into
                v_attempt_number
            from
                public.topic_tests
            where
                user_id = v_user_id
                and (paper_id = p_mock_id
                    or paper_id like p_mock_id || '-r%');
            v_new_paper_id := p_mock_id || '-r' || (v_attempt_number + 1);
        else
            return jsonb_build_object('status', 'already_attempted', 'test_id', v_existing_test_id, 'session_status', v_existing_status);
        end if;
    else
        v_new_paper_id := p_mock_id;
    end if;
    select
        id,
        paper_id
    into
        v_blocking_test_id,
        v_blocking_paper
    from
        public.topic_tests
    where
        user_id = v_user_id
        and branch_id = p_branch_id
        and status <> 'completed'
    limit 1;
    if v_blocking_test_id is not null then
        return jsonb_build_object('status', 'active_exists', 'test_id', v_blocking_test_id, 'blocking_paper_id', v_blocking_paper);
    end if;
    if now() < v_starts_at then
        return jsonb_build_object('status', 'not_live', 'starts_at', v_starts_at);
    end if;
    if v_attempt_min_tier > 0 and v_my_tier < v_attempt_min_tier then
        return jsonb_build_object('status', 'attempt_gated', 'min_tier', v_attempt_min_tier, 'my_tier', v_my_tier);
    end if;
    if now() < v_ends_at then
        v_time_allowed := greatest (0, floor(extract(epoch from (v_ends_at - now()))))::int;
    else
        v_time_allowed := v_duration_seconds;
    end if;
    if v_time_allowed < 60 then
        return jsonb_build_object('status', 'window_closing', 'seconds_left', v_time_allowed);
    end if;
    -- Record-attempt gate: tier-1+ AND explicit opt-in, default FALSE
    v_record_activity := case when v_my_tier < 1 then
        false
    else
        coalesce(p_record_activity, false)
    end;
    drop table if exists temp_mock_questions;
    create TEMP table temp_mock_questions on commit drop as
    select
        q.id, coalesce(q.marks, 1) as marks, case when q.metadata ->> 'section' = 'GA' then
            0
        else
            1
        end as section_order, q.question_number
    from
        public.questions q
    where
        q.metadata ->> 'mockId' = p_mock_id
        and upper(q.metadata ->> 'set') = upper(p_branch_id);
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
        values (v_user_id, array[coalesce(v_label, p_mock_id)], v_actual_count, v_time_allowed, 'created', v_total_marks, p_branch_id, v_new_paper_id, v_record_activity)
    returning
        id
    into
        v_new_test_id;
    insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
    select
        v_new_test_id,
        id,
        row_number() over (order by section_order, question_number),
        'unvisited'
    from
        temp_mock_questions;
    return jsonb_build_object('status', 'created', 'test_id', v_new_test_id, 'actual_count', v_actual_count, 'total_marks', v_total_marks, 'time_allowed', v_time_allowed, 'results_at', v_ends_at, 'is_re_attempt', v_is_re_attempt, 'record_activity', v_record_activity);
end;
$$;

