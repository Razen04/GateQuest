-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: core RPCs
--
-- (consolidated — absorbs patch_create_test_from_mock_record_activity
--  and expose_active_test_in_mock_catalog)
--
--   create_test_from_mock   — write path. Reads one row from `mocks`,
--                             assembles attempts from `mock_questions`.
--                             `p_record_activity` default false.
--   get_mock_catalog        — read path. Plain SELECT from `mocks`,
--                             no metadata aggregation. Returns
--                             active_test_id/label + display hints.
--   expire_mock_sessions    — cron. Joins `mocks` for window check.
-- ═══════════════════════════════════════════════════════════════════
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
    -- performs concurrent test creation for the same user and branch
    perform
        pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || lower(p_branch_id), 0));
    v_my_tier := public.get_my_tier ();
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
    select
        count(*),
        sum(coalesce(q.marks, 1))
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
    if now() < v_mock.starts_at then
        return jsonb_build_object('status', 'not_live', 'starts_at', v_mock.starts_at);
    end if;
    if v_mock.attempt_min_tier > 0 and v_my_tier < v_mock.attempt_min_tier then
        return jsonb_build_object('status', 'attempt_gated', 'min_tier', v_mock.attempt_min_tier, 'my_tier', v_my_tier);
    end if;
    if now() < v_window_ends_at then
        v_time_allowed := greatest (0, floor(extract(epoch from (v_window_ends_at - now()))))::int;
    else
        v_time_allowed := v_mock.duration_seconds;
    end if;
    if v_time_allowed < 60 then
        return jsonb_build_object('status', 'window_closing', 'seconds_left', v_time_allowed);
    end if;
    v_record_activity := case when v_my_tier < 1 then
        false
    else
        coalesce(p_record_activity, false)
    end;
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
        values (v_user_id, array[v_mock.label], v_actual_count, v_time_allowed, 'created', v_total_marks, p_branch_id, v_new_paper_id, v_record_activity)
    returning
        id
    into
        v_new_test_id;
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

comment on function public.create_test_from_mock (text, text, boolean) is 'Creates a mock test session. Reads schedule, duration, and gates from the `mocks` row; assembles attempts from `mock_questions`. Guard order: already_attempted → re_attempt_gated → active_exists → not_live → attempt_gated → window_closing → created.';

-- ─── get_mock_catalog ───────────────────────────────────────────
create or replace function public.get_mock_catalog (p_branch_id text)
    returns jsonb
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    with user_sessions as (
        select distinct on (base_mock_id)
            base_mock_id,
            session_id,
            session_status,
            session_score,
            created_at
        from (
            select
                regexp_replace(t.paper_id, '-r[0-9]+$', '') as base_mock_id,
                t.id as session_id,
                t.status as session_status,
                case when t.status = 'completed' then
                    t.score
                else
                    null
                end as session_score,
                t.created_at
            from
                public.topic_tests t
            where
                t.user_id = auth.uid ()
                and t.paper_id like 'mock-%') sub
        order by
            base_mock_id,
            created_at desc
),
active as (
    select
        id,
        topics[1] as label
    from
        public.topic_tests
    where
        user_id = auth.uid ()
        and upper(branch_id) = upper(p_branch_id)
        and status <> 'completed'
    limit 1
)
select
    coalesce(jsonb_agg(jsonb_build_object('mock_id', m.id, 'label', m.label, 'starts_at', m.starts_at, 'ends_at', m.starts_at + make_interval(secs => m.duration_seconds), 'duration_seconds', m.duration_seconds, 'question_count', (
                    select
                        count(*)
                    from public.mock_questions
                where
                    mock_id = m.id), 'total_marks', (
                    select
                        coalesce(sum(q.marks), 1)
                    from public.mock_questions mq
                    join public.questions q on q.id = mq.question_id
                where
                    mq.mock_id = m.id), 'attempt_min_tier', m.attempt_min_tier, 'post_min_tier', m.post_min_tier, 'series_number', m.series_number, 'blurb', m.blurb, 'announcement', m.announcement, 'is_live', now() >= m.starts_at
            and now() < m.starts_at + make_interval(secs => m.duration_seconds), 'results_released', now() >= m.starts_at + make_interval(secs => m.duration_seconds), 'can_attempt', auth.uid () is not null
and (m.attempt_min_tier = 0
    or public.get_my_tier () >= m.attempt_min_tier), 'attempt_lock_reason', case when auth.uid () is null then
    'login_required'
when m.attempt_min_tier > 0
    and public.get_my_tier () < m.attempt_min_tier then
    'tier_required'
else
    null
end, 'session_id', s.session_id, 'session_status', s.session_status, 'session_score', case when s.session_status = 'completed'
    and now() >= m.starts_at + make_interval(secs => m.duration_seconds) then
    s.session_score
else
    null
end, 'active_test_id', (
    select
        id
    from active), 'active_test_label', (
    select
        label
    from active))
order by m.series_number NULLS last, m.starts_at), '[]'::jsonb)
from
    public.mocks m
    left join user_sessions s on s.base_mock_id = m.id
where
    upper(m.branch) = upper(p_branch_id)
    and m.status in ('scheduled', 'live', 'archived');
$$;

grant execute on function public.get_mock_catalog (text) to authenticated;

comment on function public.get_mock_catalog (text) is 'Returns one row per mock for the branch. All gating values computed from the `mocks` row — no metadata aggregation. Source of truth for the client.';

-- ─── expire_mock_sessions ───────────────────────────────────────
create or replace function public.expire_mock_sessions ()
    returns int
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_session record;
    v_count int := 0;
    v_attempts jsonb;
begin
    for v_session in
    select
        t.id
    from
        public.topic_tests t
        join public.mocks m on t.paper_id = m.id
            or t.paper_id like m.id || '-r%'
    where
        t.paper_id like 'mock-%'
        and t.paper_id not like '%-practice-%'
        and t.status <> 'completed'
        and now() >= m.starts_at + make_interval(secs => m.duration_seconds)
    for update
        of t skip locked loop
            begin
                select
                    coalesce(jsonb_agg(jsonb_build_object('question_id', a.question_id, 'user_answer', a.user_answer, 'marked_for_review', a.marked_for_review, 'status', a.status, 'time_spent_seconds', a.time_spent_seconds, 'attempt_order', a.attempt_order)), '[]'::jsonb)
                into
                    v_attempts
                from
                    public.topic_tests_attempts a
                where
                    a.session_id = v_session.id;
                perform
                    public.submit_test_grading (v_session.id, v_attempts, 0);
                update
                    public.topic_tests
                set
                    status = 'completed'
                where
                    id = v_session.id
                    and status <> 'completed';
                v_count := v_count + 1;
            exception
                when others then
                    raise WARNING 'expire_mock_sessions failed for %: %', v_session.id, SQLERRM;
            end;
    end loop;
    return v_count;
end;

$$;

grant execute on function public.expire_mock_sessions () to service_role;

comment on function public.expire_mock_sessions () is 'Auto-submits any mock session still open past its window end. Joins `mocks` for the window boundary. Idempotent — submit_test_grading short-circuits on completed sessions. Runs every 5 minutes via pg_cron.';

do $$
begin
    if exists (
        select
            1
        from
            cron.job
        where
            jobname = 'expire-mock-sessions') then
    perform
        cron.unschedule ('expire-mock-sessions');
end if;
end
$$;

select
    cron.schedule ('expire-mock-sessions', '*/5 * * * *', 'SELECT public.expire_mock_sessions();');

