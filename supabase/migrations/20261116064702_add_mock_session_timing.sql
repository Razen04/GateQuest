-- ═══════════════════════════════════════════════════════════════════
-- Mock session timing: authoritative remaining-time source
--
-- `topic_tests.remaining_time_seconds` is written by the client
-- heartbeat and is *authoritative* for topic tests (Dexie is the source
-- of truth, Supabase is a backstop). For mocks, that model breaks:
-- the client has no Dexie copy of the session, and the heartbeat is
-- best-effort. Resume drifts. This migration makes the timer
-- server-derivable.
--
-- New columns on topic_tests:
--   started_at             — set once on created → ongoing transition
--   mock_duration_seconds  — fixed duration from mock metadata
--   mock_ends_at           — wall-clock window end for this mock
--   mock_label             — display label (header title)
--
-- All nullable. Topic tests leave them NULL. Mocks populate them at
-- creation. The client computes remaining time from these.
-- ═══════════════════════════════════════════════════════════════════
alter table public.topic_tests
    add column if not exists started_at timestamptz,
    add column if not exists mock_duration_seconds int,
    add column if not exists mock_ends_at timestamptz,
    add column if not exists mock_label text;

-- ─── Trigger: set started_at on first created → ongoing transition ───
create or replace function public.topic_tests_set_started_at ()
    returns trigger
    language plpgsql
    as $$
begin
    if new.status = 'ongoing' and old.status = 'created' and new.started_at is null then
        new.started_at := now();
    end if;
    return NEW;
end;
$$;

drop trigger if exists trg_topic_tests_set_started_at on public.topic_tests;

create trigger trg_topic_tests_set_started_at
    before update on public.topic_tests for each row
    execute function public.topic_tests_set_started_at ();

-- ─── create_test_from_mock: populate new columns ─────────────────
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

grant execute on function public.create_test_from_mock (text, text, boolean) to authenticated;

-- ─── get_mock_session_time: authoritative remaining time ─────────
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

grant execute on function public.get_mock_session_time (uuid) to authenticated;

