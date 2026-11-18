create or replace function public.get_mock_session_time (p_test_id uuid)
    returns jsonb
    language plpgsql
    stable
    security definer
    set search_path = 'public'
    as $$
declare
    v_session record;
    v_mock record;
    v_effective_end timestamptz;
begin
    select
        *
    into
        v_session
    from
        public.topic_tests
    where
        id = p_test_id
        and user_id = auth.uid ();
    if not FOUND then
        return jsonb_build_object('error', 'not_found');
    end if;
    if v_session.paper_id not like 'mock-%' or v_session.paper_id like '%-practice-%' then
        return jsonb_build_object('error', 'not_a_mock_attempt');
    end if;
    if v_session.mock_duration_seconds is null then
        return jsonb_build_object('error', 'missing_mock_metadata');
    end if;
    select
        *
    into
        v_mock
    from
        public.mocks
    where
        id = regexp_replace(v_session.paper_id, '-r[0-9]+$', '');
    if FOUND then
        v_effective_end := v_mock.starts_at + make_interval(secs => v_mock.duration_seconds);
    else
        v_effective_end := v_session.mock_ends_at;
    end if;
    -- Post-window session (started after window closed) uses its own frozen end.
    if v_session.started_at is not null and v_mock.id is not null and v_session.started_at >= (v_mock.starts_at + make_interval(secs => v_mock.duration_seconds)) then
        v_effective_end := v_session.mock_ends_at;
    end if;
    if v_session.started_at is null then
        return jsonb_build_object('not_started', true, 'duration_seconds', v_session.mock_duration_seconds, 'window_ends_at', v_effective_end, 'label', v_session.mock_label, 'time_allowed', GREATEST (0, LEAST (v_session.mock_duration_seconds, EXTRACT(EPOCH from (v_effective_end - now()))::int)));
    end if;
    return jsonb_build_object('not_started', false, 'duration_seconds', v_session.mock_duration_seconds, 'window_ends_at', v_effective_end, 'label', v_session.mock_label, 'remaining_seconds', GREATEST (0, LEAST (v_session.mock_duration_seconds - EXTRACT(EPOCH from (now() - v_session.started_at))::int, EXTRACT(EPOCH from (v_effective_end - now()))::int)));
end;
$$;

