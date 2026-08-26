create or replace function internal_calc_user_heatmap(
    p_user_id uuid,
    p_version_number int
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_today_ist date := (now() at time zone 'Asia/Kolkata')::date;
    v_start_ist date;
    v_end_ist date;
    v_heatmap jsonb;
begin
    -- Determine current academic year boundaries (Feb 8 → Feb 6)
    if extract(month from v_today_ist) > 2
       or (
           extract(month from v_today_ist) = 2
           and extract(day from v_today_ist) >= 8
       ) then

        v_start_ist := make_date(
            extract(year from v_today_ist)::int,
            2,
            8
        );

        v_end_ist := make_date(
            extract(year from v_today_ist)::int + 1,
            2,
            6
        );

    else

        v_start_ist := make_date(
            extract(year from v_today_ist)::int - 1,
            2,
            8
        );

        v_end_ist := make_date(
            extract(year from v_today_ist)::int,
            2,
            6
        );

    end if;

    /*
     * Only count activity belonging to subjects in the user's
     * CURRENT active goal.
     *
     * This is important for cases such as GATE XL where:
     *   - some subjects are mandatory
     *   - some subjects are optional
     *   - only the selected optional subjects belong to the goal
     *
     * internal_get_user_goal_subjects() encapsulates all of that logic.
     */
    select coalesce(
        jsonb_object_agg(
            attempt_date::text,
            daily_count
        ),
        '{}'::jsonb
    )
    into v_heatmap
    from (
        select
            (uqa.attempted_at at time zone 'Asia/Kolkata')::date as attempt_date,
            count(*)::int as daily_count
        from public.user_question_activity uqa

        join public.questions q
            on q.id = uqa.question_id

        join internal_get_user_goal_subjects(p_user_id) goal_subjects
            on goal_subjects.subject_id = q.subject_id

        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number
          and (uqa.attempted_at at time zone 'Asia/Kolkata')::date >= v_start_ist
          and (uqa.attempted_at at time zone 'Asia/Kolkata')::date <= v_end_ist

        group by 1
    ) active_days;

    return jsonb_build_object(
        'data', v_heatmap,
        'from_date', v_start_ist,
        'to_date', v_end_ist
    );
end;
$$;
