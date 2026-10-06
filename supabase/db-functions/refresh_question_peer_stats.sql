create or replace function "public"."refresh_question_peer_stats" ()
    returns "void"
    language "sql"
    security definer
    set "search_path" to 'public'
    as $$

with base as (
    select
        uqa.question_id::uuid as question_id,
        count(*) as total_attempts,
        count(*) filter (where uqa.was_correct) as correct_attempts,
        count(*) filter (where not uqa.was_correct) as wrong_attempts,
        avg(uqa.time_taken) filter (where uqa.time_taken is not null) as avg_time_seconds
    from public.user_question_activity uqa
    where uqa.attempt_number = 1
    group by uqa.question_id
),
option_rows as (
    select
        uqa.question_id::uuid as question_id,
        opt.option_index
    from public.user_question_activity uqa
    cross join lateral unnest(uqa.selected_option_indices) as opt(option_index)
    where uqa.attempt_number = 1
      and uqa.selected_option_indices is not null
),
option_counts as (
    select
        question_id,
        option_index,
        count(*) as chosen_count
    from option_rows
    group by question_id, option_index
),
dist as (
    select
        question_id,
        jsonb_object_agg(option_index::text, chosen_count) as distribution
    from option_counts
    group by question_id
)
insert into public.question_peer_stats (
    question_id,
    total_attempts,
    correct_attempts,
    wrong_attempts,
    avg_time_seconds,
    option_distribution,
    updated_at
)
select
    b.question_id,
    b.total_attempts,
    b.correct_attempts,
    b.wrong_attempts,
    b.avg_time_seconds,
    d.distribution,
    now()
from base b
left join dist d on d.question_id = b.question_id
on conflict (question_id) do update
set total_attempts = excluded.total_attempts,
    correct_attempts = excluded.correct_attempts,
    wrong_attempts = excluded.wrong_attempts,
    avg_time_seconds = excluded.avg_time_seconds,
    option_distribution = excluded.option_distribution,
    updated_at = now();

$$;

