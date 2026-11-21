create or replace function public.get_mock_analysis (p_test_id uuid)
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
    v_is_re_attempt boolean;
    v_rank int;
    v_total_participants int;
    v_percentile numeric;
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
    if v_test.paper_id like '%-practice-%' then
        return jsonb_build_object('error', 'not_a_mock_attempt');
    end if;
    v_base_mock_id := regexp_replace(v_test.paper_id, '-r[0-9]+$', '');
    v_is_re_attempt := v_test.paper_id ~ '-r[0-9]+$';
    if v_test.status <> 'completed' then
        return jsonb_build_object('error', 'not_completed');
    end if;
    -- Read authoritative schedule and post-results tier gate.
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
        return jsonb_build_object('error', 'embargoed', 'results_at', v_window_end);
    end if;
    if v_post_min_tier > 0 and coalesce(public.get_my_tier (), 0) < v_post_min_tier then
        return jsonb_build_object('error', 'tier_required', 'min_tier', v_post_min_tier);
    end if;
    -- Re-attempts are not leaderboard-ranked.
    if v_is_re_attempt then
        return jsonb_build_object('results_released', true, 'is_re_attempt', true, 'rank', null, 'percentile', null, 'total_participants', null, 'note', 'Re-attempts do not appear on the leaderboard.');
    end if;
    -- Rank using first completed attempt per user, exact paper_id match.
    with first_attempts as (
        select distinct on (user_id)
            user_id,
            score,
            remaining_time_seconds,
            completed_at
        from
            public.topic_tests
        where
            paper_id = v_base_mock_id
            and status = 'completed'
        order by
            user_id,
            created_at asc
),
ranked as (
    select
        *,
        row_number() over (order by score desc,
            remaining_time_seconds desc,
            completed_at asc) as rnk,
    count(*) over () as total
from
    first_attempts
)
select
    rnk,
    total
into
    v_rank,
    v_total_participants
from
    ranked
where
    user_id = auth.uid ();
    if v_total_participants > 0 and v_rank is not null then
        v_percentile := ((v_total_participants - v_rank + 1)::numeric / v_total_participants::numeric) * 100;
    end if;
    return jsonb_build_object('results_released', true, 'is_re_attempt', false, 'rank', v_rank, 'percentile', round(v_percentile, 2), 'total_participants', v_total_participants);
end;
$$;

