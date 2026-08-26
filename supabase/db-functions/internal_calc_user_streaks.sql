create or replace function internal_calc_user_streaks(
    p_user_id uuid,
    p_version_number int
)
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
    v_today_ist date := (
        now() at time zone 'Asia/Kolkata'
    )::date;
begin

    return query

    with goal_subjects as (
        /*
         * Single source of truth for the subjects belonging
         * to the user's CURRENT active goal.
         */
        select subject_id
        from internal_get_user_goal_subjects(p_user_id)
    ),

    user_activity as (
        select distinct
            (
                uqa.attempted_at at time zone 'Asia/Kolkata'
            )::date as attempt_date,
            uqa.attempt_number
        from public.user_question_activity uqa

        join public.questions q
            on q.id = uqa.question_id

        join goal_subjects gs
            on gs.subject_id = q.subject_id

        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number
    ),

    -- --------------------------------------------------
    -- Pipeline A: Study Streaks
    --
    -- Any attempt on a question belonging to the
    -- current goal counts as a study day.
    -- --------------------------------------------------

    study_ranked as (
        select
            attempt_date,
            (
                attempt_date
                - (
                    row_number() over (
                        order by attempt_date
                    )
                )::int
            ) as grp
        from (
            select distinct attempt_date
            from user_activity
        ) s
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
                ),
                0
            )::int as s_curr,

            coalesce(
                max(len),
                0
            )::int as s_long
        from study_counts
    ),

    -- --------------------------------------------------
    -- Pipeline B: Learning Streaks
    --
    -- Only first attempts on questions belonging to the
    -- current goal count as learning activity.
    -- --------------------------------------------------

    learning_ranked as (
        select
            attempt_date,
            (
                attempt_date
                - (
                    row_number() over (
                        order by attempt_date
                    )
                )::int
            ) as grp
        from (
            select distinct attempt_date
            from user_activity
            where attempt_number = 1
        ) l
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
                ),
                0
            )::int as l_curr,

            coalesce(
                max(len),
                0
            )::int as l_long
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
