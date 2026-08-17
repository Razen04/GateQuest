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
    -- Determine Current Academic Year Boundaries (Feb 8 to Feb 6)
    if extract(month from v_today_ist) > 2 
       or (extract(month from v_today_ist) = 2 and extract(day from v_today_ist) >= 8) then
        -- On or after Feb 8 (e.g., Aug 2026 -> Feb 8, 2026 to Feb 6, 2027)
        v_start_ist := make_date(extract(year from v_today_ist)::int, 2, 8);
        v_end_ist := make_date(extract(year from v_today_ist)::int + 1, 2, 6);
    else
        -- Before Feb 8 (e.g., Jan 2027 -> Feb 8, 2026 to Feb 6, 2027)
        v_start_ist := make_date(extract(year from v_today_ist)::int - 1, 2, 8);
        v_end_ist := make_date(extract(year from v_today_ist)::int, 2, 6);
    end if;

    -- Aggregate counts ONLY for active days within the academic window (Sparse Output)
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
            (attempted_at at time zone 'Asia/Kolkata')::date as attempt_date,
            count(*)::int as daily_count
        from public.user_question_activity
        where user_id = p_user_id
          and user_version_number = p_version_number
          and (attempted_at at time zone 'Asia/Kolkata')::date >= v_start_ist
          and (attempted_at at time zone 'Asia/Kolkata')::date <= v_end_ist
        group by 1
    ) active_days;

    -- Return JSON payload matching query bounds
    return jsonb_build_object(
        'data', v_heatmap,
        'from_date', v_start_ist,
        'to_date', v_end_ist
    );
end;
$$;
