create or replace function public.get_mock_leaderboard (p_mock_id text)
    returns jsonb
    language plpgsql
    stable
    security definer
    set search_path = 'public'
    as $$
declare
    v_window_end timestamptz;
    v_post_min_tier smallint;
begin
    select
        m.starts_at + make_interval(secs => m.duration_seconds),
        m.post_min_tier
    into
        v_window_end,
        v_post_min_tier
    from
        public.mocks m
    where
        m.id = p_mock_id;
    if not FOUND then
        return jsonb_build_object('error', 'mock_not_found');
    end if;
    if now() < v_window_end then
        return jsonb_build_object('error', 'embargoed', 'results_at', v_window_end);
    end if;
    if v_post_min_tier > 0 and coalesce(public.get_my_tier (), 0) < v_post_min_tier then
        return jsonb_build_object('error', 'tier_required', 'min_tier', v_post_min_tier);
    end if;
    return ( with first_attempts as (
            select distinct on (user_id)
                user_id,
                id,
                score,
                remaining_time_seconds,
                started_at,
                created_at,
                completed_at
            from
                public.topic_tests
            where
                paper_id = p_mock_id
                and status = 'completed'
            order by
                user_id,
                created_at asc),
        ranked as (
            select
                *,
                greatest(
                    0,
                    extract(epoch from (
                        completed_at - coalesce(started_at, created_at)
                    ))::int
                ) as time_seconds,
                row_number() over (order by score desc,
                    remaining_time_seconds desc,
                    completed_at asc,
                    id asc) as rank,
                count(*) over () as total_participants
            from
                first_attempts
    )
            select
                jsonb_build_object('top', (
                        select
                            coalesce(jsonb_agg(jsonb_build_object('rank', r.rank, 'user_id', r.user_id, 'username', u.username, 'name', u.name, 'avatar', u.avatar, 'tier', case when 'donor:tier-3' = any (u.notification_tags) then
                                            3
                                        when 'donor:tier-2' = any (u.notification_tags) then
                                            2
                                        when 'donor:tier-1' = any (u.notification_tags) then
                                            1
                                        else
                                            0
                                        end, 'score', r.score, 'time_seconds', r.time_seconds)
                                order by r.rank), '[]'::jsonb)
                        from ranked r
                        join public.users u on u.id = r.user_id
                        where
                            r.rank <= 100), 'my_rank', (
                            select
                                rank
                            from ranked
                            where
                                user_id = auth.uid ()), 'total_participants', (
                            select
                                max(total_participants)
                            from ranked)));
end;
$$;
