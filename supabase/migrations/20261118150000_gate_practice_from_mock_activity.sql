-- ═══════════════════════════════════════════════════════════════════
-- practice_from_mock: only donors feed UQA
-- ═══════════════════════════════════════════════════════════════════
-- A practice session was recorded unconditionally, so free-tier users
-- got UQA rows from repeated practice. Those rows look like first
-- attempts to `refresh_question_peer_stats_for_questions` and to
-- `refresh_dynamic_difficulty()`, letting a user skew both.
--
-- From now on the session's `record_activity` follows the caller's tier:
-- donors keep their practice activity (it is their first recorded
-- attempt), everyone else stays isolated. Free-tier official mock
-- sessions already behave this way via `create_test_from_mock`.
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.practice_from_mock (p_mock_id text)
    returns jsonb
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_user_id uuid := auth.uid ();
    v_my_tier smallint;
    v_has_completed boolean;
    v_post_min_tier smallint;
    v_blocking_test_id uuid;
    v_branch_id text;
    v_question_count int;
    v_total_marks int;
    v_label text;
    v_new_test_id uuid;
    v_new_paper_id text;
    v_record_activity boolean;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    v_my_tier := coalesce(public.get_my_tier (), 0);
    -- Only donors feed UQA. Free-tier practice stays isolated so repeated
    -- practice cannot skew first-attempt peer stats or dynamic difficulty.
    v_record_activity := v_my_tier >= 1;
    -- Must have completed the mock or a practice session for it.
    select
        exists (
            select
                1
            from
                public.topic_tests
            where
                user_id = v_user_id
                and status = 'completed'
                and (paper_id = p_mock_id
                    or paper_id like p_mock_id || '-r%'
                    or paper_id like p_mock_id || '-practice-%'))
    into
        v_has_completed;
    if not v_has_completed then
        return jsonb_build_object('error', 'must_complete_first', 'message', 'Complete the mock before practicing its questions.');
    end if;
    -- Read authoritative mock configuration.
    select
        m.post_min_tier,
        m.label,
        lower(m.branch)
    into
        v_post_min_tier,
        v_label,
        v_branch_id
    from
        public.mocks m
    where
        m.id = p_mock_id;
    if not FOUND then
        return jsonb_build_object('error', 'mock_not_found');
    end if;
    -- Count questions and calculate total marks from the join table.
    select
        count(*),
        coalesce(sum(coalesce(q.marks, 1)), 0)
    into
        v_question_count,
        v_total_marks
    from
        public.mock_questions mq
        join public.questions q on q.id = mq.question_id
    where
        mq.mock_id = p_mock_id;
    if v_question_count = 0 then
        return jsonb_build_object('error', 'mock_not_found');
    end if;
    -- Tier gate.
    if v_post_min_tier > 0 and v_my_tier < v_post_min_tier then
        return jsonb_build_object('error', 'tier_required', 'min_tier', v_post_min_tier);
    end if;
    -- Active test guard.
    select
        id
    into
        v_blocking_test_id
    from
        public.topic_tests
    where
        user_id = v_user_id
        and status <> 'completed'
    limit 1;
    if v_blocking_test_id is not null then
        return jsonb_build_object('error', 'active_exists', 'test_id', v_blocking_test_id);
    end if;
    v_new_paper_id := p_mock_id || '-practice-' || extract(epoch from now())::bigint::text;
    insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity)
        values (v_user_id, array[coalesce(v_label, p_mock_id) || ' (Practice)'], v_question_count, v_question_count * 162, 'created', v_total_marks, v_branch_id, v_new_paper_id, v_record_activity)
    returning
        id
    into
        v_new_test_id;
    -- Assemble attempts in the mock's configured question order.
    insert into public.topic_tests_attempts (session_id, question_id, attempt_order, status)
    select
        v_new_test_id,
        mq.question_id,
        row_number() over (order by mq.position),
        'unvisited'
    from
        public.mock_questions mq
    where
        mq.mock_id = p_mock_id;
    return jsonb_build_object('status', 'created', 'test_id', v_new_test_id, 'question_count', v_question_count, 'total_marks', v_total_marks);
end;
$$;

comment on function public.practice_from_mock (text) is
'Creates a practice session from a mock. record_activity is true for donors only, so free-tier practice cannot skew UQA-based stats.';
