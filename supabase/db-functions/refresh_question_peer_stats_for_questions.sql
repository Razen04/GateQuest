create or replace function public.refresh_question_peer_stats_for_questions (p_question_ids uuid[] default null)
    returns void
    language sql
    security definer
    set search_path = 'public'
    as $$
with mock_first as (
    -- Earliest completed official-mock attempt per (user, question).
    -- Re-attempts (`mock-x-r2`) and questions reused across mocks collapse
    -- to the first completion.
    select distinct on (t.user_id, a.question_id)
        t.user_id,
        a.question_id,
        a.is_correct as was_correct,
        a.time_spent_seconds as time_taken,
        case when q.question_type = 'numerical' then
            null
        when jsonb_typeof(a.user_answer) = 'number' then
            array[(a.user_answer #>> '{}')::int]
        when jsonb_typeof(a.user_answer) = 'array' then (
            select
                array_agg((elem #>> '{}')::int order by (elem #>> '{}')::int)
            from
                jsonb_array_elements(a.user_answer) as elem)
        end as selected_option_indices
    from
        public.topic_tests t
        join public.mocks m on (t.paper_id = m.id
                or t.paper_id like m.id || '-r%')
        join public.topic_tests_attempts a on a.session_id = t.id
        join public.questions q on q.id = a.question_id
    where
        t.status = 'completed'
        and t.paper_id like 'mock-%'
        and t.paper_id not like '%-practice-%'
        and a.user_answer is not null
        and a.is_correct is not null
        and now() >= m.starts_at + make_interval(secs => m.duration_seconds)
        and (p_question_ids is null
            or a.question_id = any (p_question_ids))
    order by
        t.user_id,
        a.question_id,
        coalesce(t.completed_at, t.updated_at, t.created_at),
        a.attempt_order
), practice_first as (
    select
        uqa.user_id,
        uqa.question_id,
        uqa.was_correct,
        uqa.time_taken,
        uqa.selected_option_indices
    from
        public.user_question_activity uqa
    where
        uqa.attempt_number = 1
        and uqa.was_correct is not null
        and (p_question_ids is null
            or uqa.question_id = any (p_question_ids))
), contributions as (
    -- Mock attempt wins over the practice row; a skipped mock question
    -- falls through to the practice row.
    select
        question_id,
        user_id,
        was_correct,
        time_taken,
        selected_option_indices
    from
        mock_first
    union all
    select
        p.question_id,
        p.user_id,
        p.was_correct,
        p.time_taken,
        p.selected_option_indices
    from
        practice_first p
    where
        not exists (
            select
                1
            from
                mock_first mf
            where
                mf.user_id = p.user_id
                and mf.question_id = p.question_id)
), base as (
    select
        question_id,
        count(*) as total_attempts,
        count(*) filter (where was_correct) as correct_attempts,
        count(*) filter (where not was_correct) as wrong_attempts,
        avg(time_taken) filter (where time_taken is not null) as avg_time_seconds
    from
        contributions
    group by
        question_id
), option_rows as (
    select
        c.question_id,
        opt.option_index
    from
        contributions c
        cross join lateral unnest(c.selected_option_indices) as opt (option_index)
    where
        c.selected_option_indices is not null
), option_counts as (
    select
        question_id,
        option_index,
        count(*) as chosen_count
    from
        option_rows
    group by
        question_id,
        option_index
), dist as (
    select
        question_id,
        jsonb_object_agg(option_index::text, chosen_count) as distribution
    from
        option_counts
    group by
        question_id
)
insert into public.question_peer_stats (question_id, total_attempts, correct_attempts, wrong_attempts, avg_time_seconds, option_distribution, updated_at)
select
    b.question_id,
    b.total_attempts,
    b.correct_attempts,
    b.wrong_attempts,
    b.avg_time_seconds,
    d.distribution,
    now()
from
    base b
    left join dist d on d.question_id = b.question_id
on conflict (question_id) do update
set total_attempts = excluded.total_attempts,
    correct_attempts = excluded.correct_attempts,
    wrong_attempts = excluded.wrong_attempts,
    avg_time_seconds = excluded.avg_time_seconds,
    option_distribution = excluded.option_distribution,
    updated_at = now();

$$;

comment on function public.refresh_question_peer_stats_for_questions (uuid[]) is
'Rebuilds question_peer_stats from first practice attempts plus completed official mock attempts. NULL = every question; empty array = no-op.';

revoke all on function public.refresh_question_peer_stats_for_questions (uuid[]) from public;

revoke all on function public.refresh_question_peer_stats_for_questions (uuid[]) from anon, authenticated;

grant execute on function public.refresh_question_peer_stats_for_questions (uuid[]) to service_role;
