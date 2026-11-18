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
    v_mock record;
    v_window_ends_at timestamptz;
    v_session_ends_at timestamptz;
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
    -- Prevent concurrent test creation for the same user and branch.
    perform
        pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || lower(p_branch_id), 0));
    v_my_tier := public.get_my_tier ();
    -- Read authoritative mock configuration.
    select
        *
    into
        v_mock
    from
        public.mocks
    where
        id = p_mock_id
        and upper(branch) = upper(p_branch_id)
        and status in ('scheduled', 'live');
    if not FOUND then
        raise exception 'Unknown mock % for branch %', p_mock_id, p_branch_id;
    end if;
    v_window_ends_at := v_mock.starts_at + make_interval(secs => v_mock.duration_seconds);
    -- Get question count and marks from the join table.
    select
        count(*),
        coalesce(sum(coalesce(q.marks, 1)), 0)
    into
        v_actual_count,
        v_total_marks
    from
        public.mock_questions mq
        join public.questions q on q.id = mq.question_id
    where
        mq.mock_id = p_mock_id;
    if coalesce(v_actual_count, 0) = 0 then
        raise exception 'Mock % has no questions', p_mock_id;
    end if;
    -- Check previous attempts.
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
    -- Prevent another active test in the same branch.
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
    -- Mock must have started.
    if now() < v_mock.starts_at then
        return jsonb_build_object('status', 'not_live', 'starts_at', v_mock.starts_at);
    end if;
    -- Attempt tier gate.
    if v_mock.attempt_min_tier > 0 and v_my_tier < v_mock.attempt_min_tier then
        return jsonb_build_object('status', 'attempt_gated', 'min_tier', v_mock.attempt_min_tier, 'my_tier', v_my_tier);
    end if;
    -- Calculate allowed time and effective session end.
    if now() < v_window_ends_at then
        v_time_allowed := greatest (0, floor(extract(epoch from (v_window_ends_at - now()))))::int;
        v_session_ends_at := v_window_ends_at;
    else
        v_time_allowed := v_mock.duration_seconds;
        v_session_ends_at := now() + make_interval(secs => v_mock.duration_seconds);
    end if;
    if v_time_allowed < 60 then
        return jsonb_build_object('status', 'window_closing', 'seconds_left', v_time_allowed);
    end if;
    -- Free users cannot record activity through mock attempts.
    v_record_activity := case when v_my_tier < 1 then
        false
    else
        coalesce(p_record_activity, false)
    end;
    -- Create session with authoritative timing fields.
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity, mock_duration_seconds, mock_ends_at, mock_label)
        values (v_user_id, array[v_mock.label], v_actual_count, v_time_allowed, 'created', v_total_marks, p_branch_id, v_new_paper_id, v_record_activity, v_mock.duration_seconds, v_session_ends_at, v_mock.label)
    returning
        id
    into
        v_new_test_id;
    -- Assemble attempts: GA first, followed by configured position.
    insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
    select
        v_new_test_id,
        mq.question_id,
        row_number() over (order by case when q.metadata ->> 'section' = 'GA' then
                0
            else
                1
            end, mq.position),
        'unvisited'
    from
        public.mock_questions mq
        join public.questions q on q.id = mq.question_id
    where
        mq.mock_id = p_mock_id;
    return jsonb_build_object('status', 'created', 'test_id', v_new_test_id, 'actual_count', v_actual_count, 'total_marks', v_total_marks, 'time_allowed', v_time_allowed, 'results_at', v_window_ends_at, 'is_re_attempt', v_is_re_attempt, 'record_activity', v_record_activity);
end;
$$;

