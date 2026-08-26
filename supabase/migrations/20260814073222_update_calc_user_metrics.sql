-- fix for issue #97(https://github.com/Razen04/GateQuest/issues/97)

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
    v_branch_id text;
    
    v_final_json jsonb;
begin
    -- Look up base user profile
    select version_number, total_xp, college, "targetYear", joined_at
    into v_user_data
    from public.users
    where id = p_user_id;

    if not found then
        raise exception 'User not found.';
    end if;

    -- Extract active goal details (Primary Exam + Branch)
    select 
        lower(branch_id), 
        lower(target_exams->>0)
    into v_branch_id, v_primary_exam
    from public.user_goals
    where user_id = p_user_id and is_active = true
    limit 1;

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

    -- Gather all valid subjects across ALL active target exams
    with active_goal_subjects as (
        select distinct s.id
        from public.user_goals ug
        cross join jsonb_array_elements_text(ug.target_exams) as te(exam_id)
        join public.exams_subjects es on lower(es.exams_id) = lower(te.exam_id)
        join public.subjects s on es.subject_id = s.id
        left join public.branch_subjects bs on bs.subject_id = s.id
        where ug.user_id = p_user_id
          and ug.is_active = true
          and (
              s.is_universal = true
              or bs.branch_id is null 
              or lower(bs.branch_id) = coalesce(v_branch_id, lower(bs.branch_id))
          )
    )
    -- Count ONLY questions attempted TODAY for the FIRST time ever
    select count(distinct uqa.question_id)::int
    into v_today_attempts
    from public.user_question_activity uqa
    join public.questions q on uqa.question_id = q.id
    join active_goal_subjects ags on q.subject_id = ags.id
    where uqa.user_id = p_user_id
      and uqa.user_version_number = v_user_data.version_number
      and (uqa.attempted_at at time zone 'Asia/Kolkata')::date = v_today_ist
      and not exists (
          select 1 
          from public.user_question_activity prev_uqa
          where prev_uqa.user_id = p_user_id
            and prev_uqa.user_version_number = v_user_data.version_number
            and prev_uqa.question_id = uqa.question_id
            and (prev_uqa.attempted_at at time zone 'Asia/Kolkata')::date < v_today_ist
      );

    -- Calculate COMBINED total available & total solved across ALL active target exams
    select 
        coalesce(sum((exam_data.value->>'total_available')::int), 0),
        coalesce(sum((exam_data.value->>'overall_attempted')::int), 0)
    into v_total_available, v_total_solved
    from jsonb_each(v_exam_stats) as exam_data;

    -- Calculate Pacing against combined pool
    v_remaining_questions := greatest(0, v_total_available - v_total_solved);
    v_days_left_completion := v_completion_date - v_today_ist;

    if v_days_left_completion > 0 then
        v_daily_target := ceil(v_remaining_questions::numeric / v_days_left_completion)::int;
    else
        v_daily_target := v_remaining_questions;
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
