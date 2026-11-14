-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: core RPCs
--
-- Three functions and one cron schedule:
--
--   create_test_from_mock   — the write path. Assembles a session from
--                             a mock's questions, enforces the full
--                             guard ordering, returns a structured
--                             status payload.
--
--   get_mock_catalog        — the read path. One round trip returning
--                             server truth per mock: live/released
--                             flags, can_attempt, session info.
--
--   expire_mock_sessions    — the cron. Auto-submits any mock session
--                             still open past its window, so "live" is
--                             actually live.
--
-- Two deviations from the plan, flagged for review:
--
--   1. active_exists guard applies to re-attempts. The plan skipped
--      it, but that would let the INSERT hit
--      idx_one_active_test_per_user_branch_active and throw a raw
--      constraint error instead of a clean active_exists payload.
--      Always checking is correct: the completed mock is not in the
--      active set, so re-attempts pass cleanly when nothing else is
--      open.
--
--   2. temp_mock_questions uses DROP TABLE IF EXISTS + CREATE TEMP
--      ... ON COMMIT DROP rather than CREATE TEMP alone. The plan's
--      version throws "table already exists" if the function is called
--      twice in the same transaction (which happens in pgTAP).
-- ═══════════════════════════════════════════════════════════════════
-- ─── create_test_from_mock — the write path ───────────────────────
create or replace function public.create_test_from_mock (p_mock_id text, p_branch_id text)
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
    v_attempts jsonb;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    v_my_tier := public.get_my_tier ();
    -- ─── Read mock facts from questions (never from client) ───
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
    -- ─── Existing session check (base mock OR its -rN attempts) ───
    -- Deliberately excludes '-practice-' sessions: those are separate
    -- from the mock attempt flow.
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
            -- Completed session: donors can re-attempt, free users cannot.
            if v_my_tier < 1 then
                return jsonb_build_object('status', 're_attempt_gated', 'test_id', v_existing_test_id, 'min_tier', 1);
            end if;
            v_is_re_attempt := true;
            -- Compute next re-attempt number from existing attempts
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
            -- Ongoing session — resume
            return jsonb_build_object('status', 'already_attempted', 'test_id', v_existing_test_id, 'session_status', v_existing_status);
        end if;
    else
        v_new_paper_id := p_mock_id;
    end if;
    -- ─── Active test guard ───
    -- ALWAYS enforced, including for re-attempts. The DB has a partial
    -- unique index on (user_id, branch_id) WHERE status <> 'completed',
    -- so any open test (practice, another mock, etc.) would cause the
    -- INSERT below to throw a raw constraint violation. Catching it
    -- here gives the client a clean actionable response.
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
    -- ─── Window check ───
    if now() < v_starts_at then
        return jsonb_build_object('status', 'not_live', 'starts_at', v_starts_at);
    end if;
    -- ─── Attempt gate (reserved for future; currently 0 for all mocks) ───
    if v_attempt_min_tier > 0 and v_my_tier < v_attempt_min_tier then
        return jsonb_build_object('status', 'attempt_gated', 'min_tier', v_attempt_min_tier, 'my_tier', v_my_tier);
    end if;
    -- ─── Time allowed ───
    -- In-window: remaining seconds until window close.
    -- After window: full duration (practice mode).
    if now() < v_ends_at then
        v_time_allowed := greatest (0, floor(extract(epoch from (v_ends_at - now()))))::int;
    else
        v_time_allowed := v_duration_seconds;
    end if;
    if v_time_allowed < 60 then
        return jsonb_build_object('status', 'window_closing', 'seconds_left', v_time_allowed);
    end if;
    -- ─── Tier-conditional activity recording ───
    -- Free users: attempts are recorded in topic_tests_attempts but NOT
    -- synced to user_question_activity / user_incorrect_queue. Donors
    -- get the full integration. submit_test_grading must respect this
    -- flag; verify with the grep in the plan's pre-flight checks.
    v_record_activity := v_my_tier >= 1;
    -- ─── Build the paper and create the session ───
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
    return jsonb_build_object('status', 'created', 'test_id', v_new_test_id, 'actual_count', v_actual_count, 'total_marks', v_total_marks, 'time_allowed', v_time_allowed, 'results_at', v_ends_at, 'is_re_attempt', v_is_re_attempt);
end;
$$;

grant execute on function public.create_test_from_mock (text, text) to authenticated;

comment on function public.create_test_from_mock (text, text) is 'Creates a mock test session. Reads schedule, duration, and attempt gate from questions.metadata->>mock*. Every gate enforced server-side, nothing trusted from caller. Returns {status: created|not_live|already_attempted|active_exists|attempt_gated|re_attempt_gated|window_closing, ...}.';

-- ─── get_mock_catalog — the read path ─────────────────────────────
create or replace function public.get_mock_catalog (p_branch_id text)
    returns jsonb
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    with facts as (
        select
            q.metadata ->> 'mockId' as mock_id,
            max(q.metadata ->> 'mockLabel') as label,
            min((q.metadata ->> 'mockStartsAt')::timestamptz) as starts_at,
            max((q.metadata ->> 'mockDurationSeconds')::int) as duration_seconds,
            max(coalesce((q.metadata ->> 'mockAttemptMinTier')::smallint, 0)) as attempt_min_tier,
            max(coalesce((q.metadata ->> 'mockPostMinTier')::smallint, 0)) as post_min_tier,
            count(*) as question_count,
            sum(coalesce(q.marks, 1)) as total_marks
        from
            public.questions q
        where
            q.metadata ->> 'mockId' is not null
            and upper(q.metadata ->> 'set') = upper(p_branch_id)
        group by
            1
),
mine as (
    -- Strip '-rN' suffix so re-attempts collapse under the base mock.
    -- Practice sessions ('-practice-') do not match the -rN pattern
    -- and therefore won't appear here — they're not mock attempts.
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
)
select
    coalesce(jsonb_agg(jsonb_build_object('mock_id', f.mock_id, 'label', f.label, 'starts_at', f.starts_at, 'ends_at', f.starts_at + make_interval(secs => f.duration_seconds), 'duration_seconds', f.duration_seconds, 'question_count', f.question_count, 'total_marks', f.total_marks, 'attempt_min_tier', f.attempt_min_tier, 'post_min_tier', f.post_min_tier, 'is_live', now() >= f.starts_at
            and now() < f.starts_at + make_interval(secs => f.duration_seconds), 'results_released', now() >= f.starts_at + make_interval(secs => f.duration_seconds), 'can_attempt', auth.uid () is not null
and (f.attempt_min_tier = 0
    or public.get_my_tier () >= f.attempt_min_tier), 'attempt_lock_reason', case when auth.uid () is null then
    'login_required'
when f.attempt_min_tier > 0
    and public.get_my_tier () < f.attempt_min_tier then
    'tier_required'
else
    null
end, 'session_id', m.session_id, 'session_status', m.session_status, 'session_score', case when m.session_status = 'completed'
    and now() >= f.starts_at + make_interval(secs => f.duration_seconds) then
    m.session_score
else
    null
end)
order by f.mock_id), '[]'::jsonb)
from
    facts f
    left join mine m on m.base_mock_id = f.mock_id;
$$;

grant execute on function public.get_mock_catalog (text) to authenticated;

comment on function public.get_mock_catalog (text) is 'Returns one row per mock for the given branch. All gating values (can_attempt, is_live, results_released, session_score) are the server''s verdict — the client never re-derives them. session_score is NULL while embargoed, populated only after results_released.';

-- ─── expire_mock_sessions — the cron ──────────────────────────────
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
    where
        t.paper_id like 'mock-%'
        and t.paper_id not like '%-practice-%'
        and t.status <> 'completed'
        and exists (
            select
                1
            from
                public.questions q
            where
                q.metadata ->> 'mockId' = regexp_replace(t.paper_id, '-r[0-9]+$', '')
                and now() >= (q.metadata ->> 'mockStartsAt')::timestamptz + make_interval(secs => (q.metadata ->> 'mockDurationSeconds')::int))
            loop
                begin
                    -- Collect current attempts from the DB (server's view, not
                    -- the client's). The heartbeat writes every 60s, so a user
                    -- who vanishes loses at most the final minute of answers.
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
                    -- Belt-and-suspenders: if submit_test_grading didn't flip
                    -- status to 'completed', do it here. A second cron cycle
                    -- would otherwise re-process the same session forever.
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
                        -- One failed session doesn't abort the batch
                        raise WARNING 'expire_mock_sessions failed for %: %', v_session.id, SQLERRM;
                end;
    end loop;
    return v_count;
end;

$$;

grant execute on function public.expire_mock_sessions () to service_role;

comment on function public.expire_mock_sessions () is 'Auto-submits any mock session still open past its window end. Idempotent: submit_test_grading short-circuits on completed sessions. Runs every 5 minutes via pg_cron. Returns count of sessions completed in this invocation.';

-- Schedule the cron
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

