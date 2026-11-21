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

