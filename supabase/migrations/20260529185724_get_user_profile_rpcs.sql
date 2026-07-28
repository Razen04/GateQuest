-- This file contains multiple rpcs to help calculate multiple things.

-- STREAKS CALCULATION
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
declare
    v_today_ist date := (now() at time zone 'Asia/Kolkata')::date;
begin
    return query
    with user_activity as (
        select 
            distinct (attempted_at at time zone 'Asia/Kolkata')::date as attempt_date,
            attempt_number
        from public.user_question_activity
        where user_id = p_user_id
          and user_version_number = p_version_number
    ),
    -- Pipeline A: Study Streaks (All attempts)
    study_ranked as (
        select
            attempt_date,
            (attempt_date - (row_number() over (order by attempt_date))::int) as grp
        from (select distinct attempt_date from user_activity) s
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
                        when end_date >= v_today_ist - interval '1 day'
                        then len
                        else 0
                    end
                ), 0
            )::int as s_curr,
            coalesce(max(len), 0)::int as s_long
        from study_counts
    ),
    -- Pipeline B: Learning Streaks (First attempts only)
    learning_ranked as (
        select
            attempt_date,
            (attempt_date - (row_number() over (order by attempt_date))::int) as grp
        from (select distinct attempt_date from user_activity where attempt_number = 1) l
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
                        when end_date >= v_today_ist - interval '1 day'
                        then len
                        else 0
                    end
                ), 0
            )::int as l_curr,
            coalesce(max(len), 0)::int as l_long
        from learning_counts
    )
    select
        sf.s_curr,
        sf.s_long,
        lf.l_curr,
        lf.l_long
    from study_final sf
    cross join learning_final lf;
end;
$$;


-- HEATMAP CALCULATION (Last 26 Weeks aligned to IST)
create or replace function internal_calc_user_heatmap(p_user_id uuid, p_version_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
    heatmap_data jsonb;
    v_today_ist date := (now() at time zone 'Asia/Kolkata')::date;
    v_start_ist date := v_today_ist - interval '26 weeks' + interval '1 day';
begin
    with date_series as (
        select generate_series(v_start_ist, v_today_ist, '1 day'::interval)::date as calendar_date
    ),
    daily_counts as (
        select
            (attempted_at at time zone 'Asia/Kolkata')::date as attempt_date,
            count(*)::int as daily_count
        from public.user_question_activity
        where user_id = p_user_id
          and user_version_number = p_version_number
          and (attempted_at at time zone 'Asia/Kolkata')::date >= v_start_ist
        group by 1
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
    left join daily_counts dc on ds.calendar_date = dc.attempt_date;

    return coalesce(heatmap_data, '[]'::jsonb);
end;
$$;


-- EXAM STATS CALCULATION
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
    -- Get user goals safely
    select lower(branch_id), lower(nullif(jsonb_array_elements_text(target_exams), ''))
    into v_branch_id, v_primary_exam
    from public.user_goals
    where user_id = p_user_id and is_active = true
    limit 1;

    if v_primary_exam is null or v_branch_id is null then
        return '{}'::jsonb;
    end if;

    -- Calculate Total Available Questions
    select coalesce(sum(s.question_count), 0)::int
    into v_exam_total_available
    from public.branch_subjects bs
    join public.exams_subjects es on bs.subject_id = es.subject_id
    join public.subjects s on s.id = bs.subject_id
    where lower(bs.branch_id) = v_branch_id and lower(es.exams_id) = v_primary_exam;

    -- Build Subject Array & Aggregates
    with subject_activity as (
        select
            q.subject_id,
            count(distinct uqa.question_id)::int as attempted,
            sum(case when uqa.was_correct then 1 else 0 end)::int as correct,
            -- Safe division for activity accuracy
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
                'icon_name', s.icon_name,
                'theme_color', s.theme_color,
                'attempted', coalesce(sa.attempted, 0),
                'correct', coalesce(sa.correct, 0),
                'accuracy', coalesce(sa.accuracy, 0),
                'total_available', coalesce(s.question_count, 0),
                -- Safe division guarding against s.question_count = 0 or NULL
                'progress', case 
                    when coalesce(s.question_count, 0) > 0 
                    then least(100, round(coalesce(sa.attempted, 0) * 100.0 / nullif(s.question_count, 0)))::int 
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
            'overall_accuracy', case 
                when coalesce(overall_attempted, 0) > 0 
                then round(coalesce(overall_correct, 0) * 100.0 / nullif(overall_attempted, 0))::int 
                else 0 
            end,
            'total_available', v_exam_total_available,
            'subjects', coalesce(subjects_array, '[]'::jsonb)
        )
    ) into final_json
    from subject_agg;

    return coalesce(final_json, '{}'::jsonb);
end;
$$;


-- GLOBAL STATS HELPER
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
        'total_unique_solved', coalesce(o.total_unique_solved, 0),
        'total_attempts', coalesce(o.total_attempts, 0),
        'overall_accuracy', coalesce(o.overall_accuracy, 0),
        'question_types', ta.qt
    ) into v_global_stats
    from overall o, type_agg ta;

    return coalesce(v_global_stats, '{}'::jsonb);
end;
$$;


-- RECENT HISTORY HELPER
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


-- CORE METRICS ENGINE
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
    
    v_today_ist date;
    v_target_year int;
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
    -- Look up base fields
    select version_number, total_xp, college, "targetYear", joined_at
    into v_user_data
    from public.users
    where id = p_user_id;

		if not found then
    	raise exception 'User not found.';
		end if;

    -- Fallback targetYear if null or invalid
    v_target_year := coalesce(v_user_data."targetYear", extract(year from now())::int + 1);

    -- Execute standard helpers
    select * into v_streaks from internal_calc_user_streaks(p_user_id, v_user_data.version_number);
    v_heatmap := internal_calc_user_heatmap(p_user_id, v_user_data.version_number);
    v_exam_stats := internal_calc_exam_stats(p_user_id, v_user_data.version_number);
    v_global_stats := internal_calc_global_stats(p_user_id, v_user_data.version_number);
    v_recent_history := internal_calc_recent_history(p_user_id, v_user_data.version_number);

    -- Calculate Dashboard Target Operations (IST Offset)
    v_today_ist := (now() at time zone 'Asia/Kolkata')::date;
    v_exam_date := make_date(v_target_year, 2, 7);
    v_completion_date := make_date(v_target_year, 1, 15);

    -- Get today's unique attempts in IST
    select count(distinct question_id)::int
    into v_today_attempts
    from public.user_question_activity
    where user_id = p_user_id
      and user_version_number = v_user_data.version_number
      and (attempted_at at time zone 'Asia/Kolkata')::date = v_today_ist;

    -- Extract totals to calculate pacing
    v_total_solved := coalesce((v_global_stats->>'total_unique_solved')::int, 0);
    v_primary_exam := (select jsonb_object_keys(v_exam_stats) limit 1);
    
    if v_primary_exam is not null then
        v_total_available := coalesce((v_exam_stats->v_primary_exam->>'total_available')::int, 0);
    else
        v_total_available := 0;
    end if;
    
    v_remaining_questions := greatest(0, v_total_available - v_total_solved);
    v_days_left_completion := v_completion_date - v_today_ist;

    -- Safe target pacing computation
    if v_days_left_completion > 0 then
        v_daily_target := ceil(v_remaining_questions::numeric / v_days_left_completion)::int;
    else
        v_daily_target := v_remaining_questions; -- Past target date: finish all remaining
    end if;

    -- Final JSON Assembly
    v_final_json := jsonb_build_object(
        'profile', jsonb_build_object(
            'total_xp', coalesce(v_user_data.total_xp, 0),
            'college', v_user_data.college,
            'targetYear', v_target_year,
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
            'today_progress_percent', case 
                when coalesce(v_daily_target, 0) > 0 
                then least(100, round(coalesce(v_today_attempts, 0) * 100.0 / nullif(v_daily_target, 0)))::int 
                else 100 
            end,
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
