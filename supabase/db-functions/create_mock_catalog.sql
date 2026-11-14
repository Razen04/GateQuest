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

