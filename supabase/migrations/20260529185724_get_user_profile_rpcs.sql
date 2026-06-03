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
    v_branch_id text;
    v_primary_exam text;
    v_exam_total_available int := 0;
begin
    -- 1. Get user goals
    select branch_id, nullif(jsonb_array_elements_text(target_exams), '')
    into v_branch_id, v_primary_exam
    from public.user_goals
    where user_id = p_user_id and is_active = true
    limit 1;

    v_primary_exam := lower(v_primary_exam);

    if v_primary_exam is null or v_branch_id is null then
        return '{}'::jsonb;
    end if;

    -- 2. Calculate Total Available Questions
    select coalesce(sum(s.question_count), 0)::int
    into v_exam_total_available
    from public.branch_subjects bs
    join public.exams_subjects es on bs.subject_id = es.subject_id
    join public.subjects s on s.id = bs.subject_id
    where bs.branch_id = v_branch_id and lower(es.exams_id) = v_primary_exam;

    -- 3. Build Subject Array & Aggregates
    with subject_activity as (
        select
            q.subject_id,
            count(distinct uqa.question_id)::int as attempted,
            sum(case when uqa.was_correct then 1 else 0 end)::int as correct,
            coalesce(round(sum(case when uqa.was_correct then 1 else 0 end) * 100.0 / nullif(count(uqa.id), 0)), 0)::int as accuracy
        from public.user_question_activity uqa
        join public.questions q on uqa.question_id = q.id
        where uqa.user_id = p_user_id and uqa.user_version_number = p_version_number
        group by q.subject_id
    ),
    subject_agg as (
        select jsonb_agg(
            jsonb_build_object(
                'subject_name', s.name,
                'subject_slug', s.slug,
                'icon_name', s.icon_name,     -- NEW
                'theme_color', s.theme_color, -- NEW
                'attempted', coalesce(sa.attempted, 0),
                'correct', coalesce(sa.correct, 0),
                'accuracy', coalesce(sa.accuracy, 0),
                'total_available', coalesce(s.question_count, 0),
                -- NEW: Pre-calculated progress percentage
                'progress', case 
                    when coalesce(s.question_count, 0) > 0 
                    then least(100, round(coalesce(sa.attempted, 0) * 100.0 / s.question_count))::int 
                    else 0 
                end 
            )
        ) as subjects_array,
        sum(coalesce(sa.attempted, 0))::int as overall_attempted,
        sum(coalesce(sa.correct, 0))::int as overall_correct
        from public.branch_subjects bs
        join public.exams_subjects es on bs.subject_id = es.subject_id
        join public.subjects s on s.id = bs.subject_id
        left join subject_activity sa on s.id = sa.subject_id
        where bs.branch_id = v_branch_id and lower(es.exams_id) = v_primary_exam
    )
    select jsonb_build_object(
        v_primary_exam, jsonb_build_object(
            'overall_attempted', coalesce(overall_attempted, 0),
            'overall_accuracy', case when coalesce(overall_attempted, 0) > 0 then round(overall_correct * 100.0 / overall_attempted)::int else 0 end,
            'total_available', v_exam_total_available,
            'subjects', coalesce(subjects_array, '[]'::jsonb)
        )
    ) into final_json
    from subject_agg;

    return coalesce(final_json, '{}'::jsonb);
end;
$$;

-- Global stats helper
create or replace function internal_calc_global_stats(p_user_id uuid, p_version_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_global_stats jsonb;
begin
    with overall as (
        select
            count(distinct uqa.question_id)::int as total_unique_solved,
            count(uqa.id)::int as total_attempts,
            coalesce(round(sum(case when uqa.was_correct then 1 else 0 end) * 100.0 / nullif(count(uqa.id), 0)), 0)::int as overall_accuracy
        from public.user_question_activity uqa
        where uqa.user_id = p_user_id and uqa.user_version_number = p_version_number
    ),
    type_counts as (
        select
            q.question_type as q_type,
            count(distinct uqa.question_id)::int as solved,
            coalesce(round(sum(case when uqa.was_correct then 1 else 0 end) * 100.0 / nullif(count(uqa.id), 0)), 0)::int as accuracy
        from public.user_question_activity uqa
        join public.questions q on uqa.question_id = q.id
        where uqa.user_id = p_user_id and uqa.user_version_number = p_version_number
        group by q.question_type
    ),
    type_agg as (
        select coalesce(jsonb_agg(
            jsonb_build_object(
                'type', q_type,
                'solved', solved,
                'accuracy', accuracy
            )
        ), '[]'::jsonb) as qt
        from type_counts
    )
    select jsonb_build_object(
        'total_unique_solved', o.total_unique_solved,
        'total_attempts', o.total_attempts,
        'overall_accuracy', o.overall_accuracy,
        'question_types', ta.qt
    ) into v_global_stats
    from overall o, type_agg ta;

    return coalesce(v_global_stats, '{}'::jsonb);
end;
$$;

-- Recent History helper
create or replace function internal_calc_recent_history(p_user_id uuid, p_version_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_history jsonb;
begin
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'question_id', uqa.question_id,
            'question_text', q.question, 
            'subject_name', s.name,
            'exam_year', q.year,
            'marks', q.marks,
            'question_type', q.question_type,
            'was_correct', uqa.was_correct,
            'time_taken', uqa.time_taken,
            'attempted_at', uqa.attempted_at
        )
    ), '[]'::jsonb) into v_history
    from (
        select *
        from public.user_question_activity
        where user_id = p_user_id and user_version_number = p_version_number
        order by attempted_at desc
        limit 10
    ) uqa
    join public.questions q on uqa.question_id = q.id
    left join public.subjects s on q.subject_id = s.id;

    return v_history;
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
    v_global_stats jsonb;
    v_recent_history jsonb;
    
    -- Dashboard Specific Variables
    v_today_ist date;
    v_exam_date date;
    v_completion_date date;
    v_today_attempts int;
    v_total_solved int;
    v_total_available int;
    v_remaining_questions int;
    v_days_left_completion int;
    v_daily_target int;
    v_primary_exam text;
    
    v_final_json jsonb;
begin
    -- 1. Look up base fields
    select version_number, total_xp, college, "targetYear", joined_at
    into v_user_data
    from public.users
    where id = p_user_id;

    if not found then
        return jsonb_build_object('error', 'user not found or deleted');
    end if;

    -- 2. Execute standard helpers
    select * into v_streaks from internal_calc_user_streaks(p_user_id, v_user_data.version_number);
    v_heatmap := internal_calc_user_heatmap(p_user_id, v_user_data.version_number);
    v_exam_stats := internal_calc_exam_stats(p_user_id, v_user_data.version_number);
    v_global_stats := internal_calc_global_stats(p_user_id, v_user_data.version_number);
    v_recent_history := internal_calc_recent_history(p_user_id, v_user_data.version_number);

    -- 3. Calculate Private Dashboard Operations (IST Offset)
    v_today_ist := (now() at time zone 'UTC' at time zone 'Asia/Kolkata')::date;
    v_exam_date := make_date(v_user_data."targetYear", 2, 7);
    v_completion_date := make_date(v_user_data."targetYear", 1, 15);

    -- Get today's unique attempts strictly in IST
    select count(distinct question_id)::int
    into v_today_attempts
    from public.user_question_activity
    where user_id = p_user_id
      and user_version_number = v_user_data.version_number
      and (attempted_at at time zone 'UTC' at time zone 'Asia/Kolkata')::date = v_today_ist;

    -- Extract totals to calculate pacing
    v_total_solved := coalesce((v_global_stats->>'total_unique_solved')::int, 0);
    v_primary_exam := (select jsonb_object_keys(v_exam_stats) limit 1);
    v_total_available := coalesce((v_exam_stats->v_primary_exam->>'total_available')::int, 0);
    
    v_remaining_questions := greatest(0, v_total_available - v_total_solved);
    v_days_left_completion := v_completion_date - v_today_ist;

    -- Calculate pacing target
    if v_days_left_completion > 0 then
        v_daily_target := ceil(v_remaining_questions::numeric / v_days_left_completion)::int;
    else
        v_daily_target := v_remaining_questions; -- Must finish whatever is left!
    end if;

    -- 4. Final JSON Assembly
    v_final_json := jsonb_build_object(
        'profile', jsonb_build_object(
            'total_xp', coalesce(v_user_data.total_xp, 0),
            'college', v_user_data.college,
            'targetYear', v_user_data."targetYear",
            'current_version', v_user_data.version_number,
            'joined_at', v_user_data.joined_at
        ),
        'streaks', jsonb_build_object(
            'study_current', coalesce(v_streaks.study_current_streak, 0),
            'study_longest', coalesce(v_streaks.study_longest_streak, 0),
            'learning_current', coalesce(v_streaks.learning_current_streak, 0),
            'learning_longest', coalesce(v_streaks.learning_longest_streak, 0)
        ),
        'dashboard_stats', jsonb_build_object(
            'today_unique_attempt_count', coalesce(v_today_attempts, 0),
            'daily_question_target', coalesce(v_daily_target, 0),
            'days_left', greatest(0, v_exam_date - v_today_ist),
            'is_target_met_today', coalesce(v_today_attempts, 0) >= coalesce(v_daily_target, 0),
            'today_progress_percent', case when coalesce(v_daily_target, 0) > 0 then least(100, round(coalesce(v_today_attempts, 0) * 100.0 / v_daily_target)) else 100 end,
            'exam_date', v_exam_date
        ),
        'global_stats', v_global_stats,
        'heatmap', v_heatmap,
        'exam_stats', v_exam_stats,
        'recent_history', v_recent_history
    );

    return v_final_json;
end;
$$;
