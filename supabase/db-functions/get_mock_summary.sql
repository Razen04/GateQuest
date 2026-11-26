create or replace function public.get_mock_summary (p_test_id uuid)
    returns jsonb
    language plpgsql
    stable
    security definer
    set search_path = 'public'
    as $$
declare
    v_test record;
    v_base_mock_id text;
    v_window_end timestamptz;
    v_post_min_tier smallint;
    v_positive numeric;
    v_negative numeric;
    v_is_re_attempt boolean;
begin
    select
        *
    into
        v_test
    from
        public.topic_tests
    where
        id = p_test_id
        and user_id = auth.uid ();
    if not FOUND then
        return jsonb_build_object('error', 'not_found');
    end if;
    -- Practice-from-mock sessions are regular topic tests,
    -- not mock attempts.
    if v_test.paper_id like '%-practice-%' then
        return jsonb_build_object('error', 'not_a_mock_attempt');
    end if;
    v_base_mock_id := regexp_replace(v_test.paper_id, '-r[0-9]+$', '');
    v_is_re_attempt := v_test.paper_id ~ '-r[0-9]+$';
    if v_test.status <> 'completed' then
        return jsonb_build_object('error', 'not_completed');
    end if;
    -- Read the authoritative mock schedule and post-results gate.
    select
        m.starts_at + make_interval(secs => m.duration_seconds),
        m.post_min_tier
    into
        v_window_end,
        v_post_min_tier
    from
        public.mocks m
    where
        m.id = v_base_mock_id;
    -- Fail closed if the mock record is missing.
    if not FOUND then
        return jsonb_build_object('error', 'mock_not_found');
    end if;
    if now() < v_window_end then
        return jsonb_build_object('results_released', false, 'results_at', v_window_end);
    end if;
    -- Positive and negative sums from graded attempts.
    select
        coalesce(sum(
                case when score > 0 then
                    score
                else
                    0
                end), 0),
        coalesce(sum(
                case when score < 0 then
                    score
                else
                    0
                end), 0)
    into
        v_positive,
        v_negative
    from
        public.topic_tests_attempts
    where
        session_id = p_test_id;
    return jsonb_build_object('results_released', true, 'mock_id', v_base_mock_id, 'is_re_attempt', v_is_re_attempt, 'total_score', v_test.score, 'positive_score', v_positive, 'negative_score', v_negative, 'total_marks', v_test.total_marks, 'attempted_count', coalesce(v_test.attempted_count, 0), 'correct_count', coalesce(v_test.correct_count, 0), 'incorrect_count', greatest(0, coalesce(v_test.attempted_count, 0) - coalesce(v_test.correct_count, 0)), 'analysis_unlocked', (v_post_min_tier = 0
            or coalesce(public.get_my_tier (), 0) >= v_post_min_tier));
end;
$$;

