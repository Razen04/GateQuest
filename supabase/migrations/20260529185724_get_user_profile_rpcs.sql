-- This file contains multiple rpcs to help calculate multiple things.
-- First is calculating longest streak of user, this is a classic Gaps and Islands problem, more info in DOCS.
create or replace function internal_calc_user_streaks(p_user_id uuid, p_version_number int)
returns table (
    study_current_streak int,
    study_longest_streak int,
    learning_current_streak int,
    learning_longest_streak int
)
language plpgsql
security definer
as $$
begin
    return query

    -- pipeline a: study streaks (all attempts)
    with study_dates as (
        select distinct date(attempted_at) as attempt_date
        from public.user_question_activity
        where user_id = p_user_id
          and user_version_number = p_version_number
    ),
    study_ranked as (
        select
            attempt_date,
            (attempt_date - (row_number() over (order by attempt_date))::int) as grp
        from study_dates
    ),
    study_counts as (
        select
            grp,
            count(*)::int as len,
            max(attempt_date) as end_date
        from study_ranked
        group by grp
    ),
    study_final as (
        select
            coalesce(
                max(
                    case
                        when end_date >= current_date - interval '1 day'
                        then len
                        else 0
                    end
                ),
                0
            )::int as s_curr,
            coalesce(max(len), 0)::int as s_long
        from study_counts
    ),

    -- pipeline b: learning streaks (new questions only)
    learning_dates as (
        select distinct date(attempted_at) as attempt_date
        from public.user_question_activity
        where user_id = p_user_id
          and user_version_number = p_version_number
          and attempt_number = 1 -- strict progress filter
    ),
    learning_ranked as (
        select
            attempt_date,
            (attempt_date - (row_number() over (order by attempt_date))::int) as grp
        from learning_dates
    ),
    learning_counts as (
        select
            grp,
            count(*)::int as len,
            max(attempt_date) as end_date
        from learning_ranked
        group by grp
    ),
    learning_final as (
        select
            coalesce(
                max(
                    case
                        when end_date >= current_date - interval '1 day'
                        then len
                        else 0
                    end
                ),
                0
            )::int as l_curr,
            coalesce(max(len), 0)::int as l_long
        from learning_counts
    )

    -- combine results
    select
        sf.s_curr,
        sf.s_long,
        lf.l_curr,
        lf.l_long
    from study_final sf
    cross join learning_final lf;
end;
$$;

-- Heatmap calculation will be based on any engagement in the app that is it will count re-attempts too to populate, it will give last 26 weeks data.
create or replace function internal_calc_user_heatmap(p_user_id uuid, p_version_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
    heatmap_data jsonb;
begin
    with date_series as (
        select generate_series(
            current_date - interval '26 weeks' + interval '1 day',
            current_date,
            '1 day'::interval
        )::date as calendar_date
    ),
    daily_counts as (
        select
            date(attempted_at) as attempt_date,
            count(*)::int as daily_count
        from public.user_question_activity
        where user_id = p_user_id
          and user_version_number = p_version_number
          and attempted_at >= current_date - interval '26 weeks'
        group by date(attempted_at)
    )
    select jsonb_agg(
        jsonb_build_object(
            'date', ds.calendar_date,
            'count', coalesce(dc.daily_count, 0)
        )
        order by ds.calendar_date asc
    )
    into heatmap_data
    from date_series ds
    left join daily_counts dc
        on ds.calendar_date = dc.attempt_date;

    return coalesce(heatmap_data, '[]'::jsonb);
end;
$$;

-- Subject stats calculation (Overall progress and accuracy and subject-wise data)
create or replace function internal_calc_exam_stats(p_user_id uuid, p_version_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
    final_json jsonb;
begin
    with active_goals as (
        select
            jsonb_array_elements_text(target_exams) as exam_key,
            lower(jsonb_array_elements_text(target_exams)) as exam_key_lower
        from public.user_goals
        where user_id = p_user_id
          and is_active = true
        limit 1
    ),
    user_activity as (
        select
            uqa.subject as subject_name,
            uqa.was_correct,
            uqa.time_taken,
            uqa.attempted_at,
            jsonb_array_elements_text(
                case
                    when jsonb_typeof(q.metadata->'exam') = 'array' then q.metadata->'exam'
                    when jsonb_typeof(q.metadata->'exam') = 'string' then jsonb_build_array(q.metadata->'exam')
                    else '[]'::jsonb
                end
            ) as question_exam
        from public.user_question_activity uqa
        join public.questions q
            on uqa.question_id = q.id
        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number
          and uqa.attempt_number = 1
    ),
    matched_activity as (
        select
            ag.exam_key,
            ua.subject_name,
            ua.was_correct,
            ua.time_taken,
            ua.attempted_at
        from active_goals ag
        left join user_activity ua
            on ag.exam_key_lower = lower(ua.question_exam)
    ),
    subject_agg as (
        select
            exam_key,
            subject_name,
            count(subject_name)::int as total_attempted,
            count(subject_name) filter (where was_correct = true)::int as total_correct,
            coalesce(avg(time_taken), 0)::int as avg_time_seconds,
            max(attempted_at) as last_practiced
        from matched_activity
        where subject_name is not null
        group by exam_key, subject_name
    ),
    exam_agg as (
        select
            ag.exam_key,
            coalesce(
                (
                    select jsonb_agg(
                        jsonb_build_object(
                            'subject_name', sa.subject_name,
                            'attempted', sa.total_attempted,
                            'correct', sa.total_correct,
                            'accuracy',
                                case
                                    when sa.total_attempted > 0
                                        then round((sa.total_correct::numeric / sa.total_attempted) * 100)::int
                                    else 0
                                end,
                            'avg_time_seconds', sa.avg_time_seconds,
                            'last_practiced', sa.last_practiced
                        )
                    )
                    from subject_agg sa
                    where sa.exam_key = ag.exam_key
                ),
                '[]'::jsonb
            ) as subjects_array,

            coalesce(
                (select sum(total_attempted)::int from subject_agg sa where sa.exam_key = ag.exam_key),
                0
            ) as exam_total_attempted,

            coalesce(
                (select sum(total_correct)::int from subject_agg sa where sa.exam_key = ag.exam_key),
                0
            ) as exam_total_correct
        from active_goals ag
    )
    select coalesce(jsonb_object_agg(
        exam_key,
        jsonb_build_object(
            'overall_attempted', exam_total_attempted,
            'overall_accuracy',
                case
                    when exam_total_attempted > 0
                        then round((exam_total_correct::numeric / exam_total_attempted) * 100)::int
                    else 0
                end,
            'subjects', subjects_array
        )
    ), '{}'::jsonb)
    into final_json
    from exam_agg;

    return final_json;
end;
$$;

-- Core rpc to bind all the above helpers
create or replace function calc_user_metrics(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_user_data record;
    v_streaks record;
    v_heatmap jsonb;
    v_exam_stats jsonb;
    v_final_json jsonb;
begin
    -- the trust fall (internal version lookup)
    select version_number, total_xp, college, target_year
    into v_user_data
    from public.users
    where id = p_user_id;

    -- if the user doesn't exist (or was soft-deleted), abort and return an error json
    if not found then
        return jsonb_build_object('error', 'user not found or deleted');
    end if;

    -- execute the helpers
    -- get the streaks (returns a record of 4 integers)
    select *
    into v_streaks
    from internal_calc_user_streaks(p_user_id, v_user_data.version_number);

    -- get the heatmap (returns a jsonb array)
    v_heatmap := internal_calc_user_heatmap(p_user_id, v_user_data.version_number);

    -- get the exam-segregated stats (returns a jsonb object)
    v_exam_stats := internal_calc_exam_stats(p_user_id, v_user_data.version_number);

    -- the final json payload
    v_final_json := jsonb_build_object(
        -- global user data
        'profile', jsonb_build_object(
            'total_xp', coalesce(v_user_data.total_xp, 0),
            'college', v_user_data.college,
            'target_year', v_user_data.target_year,
            'current_version', v_user_data.version_number
        ),

        -- the hybrid streaks
        'streaks', jsonb_build_object(
            'study_current', v_streaks.study_current_streak,
            'study_longest', v_streaks.study_longest_streak,
            'learning_current', v_streaks.learning_current_streak,
            'learning_longest', v_streaks.learning_longest_streak
        ),

        -- activity & progress
        'heatmap', v_heatmap,
        'exam_stats', v_exam_stats
    );

    return v_final_json;
end;
$$;
