create or replace function internal_calc_exam_stats(
    p_user_id uuid,
    p_version_number int
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_final_stats jsonb;
begin

    with active_goal as (
        select target_exams
        from public.user_goals
        where user_id = p_user_id
          and is_active = true
        limit 1
    ),

    -- Exams currently selected by the user's active goal
    user_target_exams as (
        select distinct
            lower(te.exam_id) as exam_id
        from active_goal ag
        cross join jsonb_array_elements_text(ag.target_exams) as te(exam_id)
    ),

    -- Subjects currently belonging to the user's active goal
    goal_subjects as (
        select distinct subject_id
        from internal_get_user_goal_subjects(p_user_id)
    ),

    /*
     * Valid subject/exam combinations for the current goal.
     *
     * The helper determines whether the subject belongs to the goal.
     * exams_subjects determines whether that subject belongs to that exam.
     */
    exam_subjects as (
        select distinct
            ute.exam_id,
            s.id as subject_id,
            s.name as subject_name,
            s.slug as subject_slug,
            s.icon_name,
            s.theme_color
        from user_target_exams ute
        join public.exams_subjects es
            on lower(es.exams_id) = ute.exam_id
        join goal_subjects gs
            on gs.subject_id = es.subject_id
        join public.subjects s
            on s.id = gs.subject_id
    ),

    /*
     * Total available questions per exam + subject.
     */
    exam_question_counts as (
        select
            es.exam_id,
            q.subject_id,
            count(q.id)::int as available_count
        from exam_subjects es
        join public.questions q
            on q.subject_id = es.subject_id
        where (
            (
                jsonb_typeof(q.metadata->'exam') = 'array'
                and q.metadata->'exam' @> jsonb_build_array(upper(es.exam_id))
            )
            or
            (
                jsonb_typeof(q.metadata->'exam') = 'string'
                and lower(q.metadata->>'exam') = es.exam_id
            )
        )
        group by
            es.exam_id,
            q.subject_id
    ),

    /*
     * User's first-attempt statistics per exam + subject.
     */
    subject_activity as (
        select
            es.exam_id,
            q.subject_id,
            count(uqa.id)::int as attempted,
            sum(
                case
                    when uqa.was_correct then 1
                    else 0
                end
            )::int as correct
        from public.user_question_activity uqa
        join public.questions q
            on q.id = uqa.question_id
        join exam_subjects es
            on es.subject_id = q.subject_id
        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number
          and uqa.attempt_number = 1
          and (
              (
                  jsonb_typeof(q.metadata->'exam') = 'array'
                  and q.metadata->'exam' @> jsonb_build_array(upper(es.exam_id))
              )
              or
              (
                  jsonb_typeof(q.metadata->'exam') = 'string'
                  and lower(q.metadata->>'exam') = es.exam_id
              )
          )
        group by
            es.exam_id,
            q.subject_id
    ),

    /*
     * Combine availability + activity.
     */
    exam_agg as (
        select
            es.exam_id,

            jsonb_agg(
                jsonb_build_object(
                    'subject_name', es.subject_name,
                    'subject_slug', es.subject_slug,
                    'icon_name', es.icon_name,
                    'theme_color', es.theme_color,

                    'attempted',
                        coalesce(sa.attempted, 0),

                    'correct',
                        coalesce(sa.correct, 0),

                    'accuracy',
                        case
                            when coalesce(sa.attempted, 0) > 0
                            then least(
                                100,
                                round(
                                    coalesce(sa.correct, 0) * 100.0
                                    / nullif(sa.attempted, 0)
                                )
                            )::int
                            else 0
                        end,

                    'total_available',
                        coalesce(eqc.available_count, 0),

                    'progress',
                        case
                            when coalesce(eqc.available_count, 0) > 0
                            then least(
                                100,
                                round(
                                    coalesce(sa.attempted, 0) * 100.0
                                    / nullif(eqc.available_count, 0)
                                )
                            )::int
                            else 0
                        end
                )
                order by es.subject_name
            ) as subjects_array,

            sum(
                coalesce(eqc.available_count, 0)
            )::int as total_available,

            sum(
                coalesce(sa.attempted, 0)
            )::int as overall_attempted,

            sum(
                coalesce(sa.correct, 0)
            )::int as overall_correct

        from exam_subjects es

        left join exam_question_counts eqc
            on eqc.exam_id = es.exam_id
           and eqc.subject_id = es.subject_id

        left join subject_activity sa
            on sa.exam_id = es.exam_id
           and sa.subject_id = es.subject_id

        group by es.exam_id
    )

    /*
     * Build:
     *
     * {
     *   "gate": {
     *      ...
     *   },
     *   "isro": {
     *      ...
     *   }
     * }
     */
    select jsonb_object_agg(
        ea.exam_id,
        jsonb_build_object(
            'overall_attempted',
                coalesce(ea.overall_attempted, 0),

            'overall_accuracy',
                case
                    when coalesce(ea.overall_attempted, 0) > 0
                    then least(
                        100,
                        round(
                            coalesce(ea.overall_correct, 0) * 100.0
                            / nullif(ea.overall_attempted, 0)
                        )
                    )::int
                    else 0
                end,

            'total_available',
                coalesce(ea.total_available, 0),

            'subjects',
                coalesce(
                    ea.subjects_array,
                    '[]'::jsonb
                )
        )
    )
    into v_final_stats
    from exam_agg ea;

    return coalesce(
        v_final_stats,
        '{}'::jsonb
    );

end;
$$;

create or replace function internal_calc_global_stats(
    p_user_id uuid,
    p_version_number int
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_global_stats jsonb;
begin

    /*
     * Subjects belonging to the user's CURRENT active goal.
     *
     * This is the single source of truth for goal membership.
     */
    with goal_subjects as (
        select distinct subject_id
        from internal_get_user_goal_subjects(p_user_id)
    ),

    /*
     * Overall statistics are restricted to questions
     * belonging to the current goal.
     */
    overall as (
        select
            count(distinct uqa.question_id)::int as total_unique_solved,

            count(uqa.id)::int as total_attempts,

            coalesce(
                round(
                    sum(
                        case
                            when uqa.was_correct then 1
                            else 0
                        end
                    ) * 100.0
                    / nullif(count(uqa.id), 0)
                ),
                0
            )::int as overall_accuracy

        from public.user_question_activity uqa

        join public.questions q
            on q.id = uqa.question_id

        join goal_subjects gs
            on gs.subject_id = q.subject_id

        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number
    ),

    /*
     * Total available questions per question type,
     * restricted to the current goal subjects.
     */
    total_available_by_type as (
        select
            q.question_type as q_type,
            count(*)::int as total_available

        from public.questions q

        join goal_subjects gs
            on gs.subject_id = q.subject_id

        group by q.question_type
    ),

    /*
     * User activity per question type,
     * restricted to the current goal subjects.
     */
    type_counts as (
        select
            q.question_type as q_type,

            count(distinct uqa.question_id)::int as solved,

            coalesce(
                round(
                    sum(
                        case
                            when uqa.was_correct then 1
                            else 0
                        end
                    ) * 100.0
                    / nullif(count(uqa.id), 0)
                ),
                0
            )::int as accuracy

        from public.user_question_activity uqa

        join public.questions q
            on q.id = uqa.question_id

        join goal_subjects gs
            on gs.subject_id = q.subject_id

        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number

        group by q.question_type
    ),

    /*
     * Combine availability and activity.
     *
     * Types with available questions but no user activity
     * still appear with solved = 0 and accuracy = 0.
     */
    type_agg as (
        select
            coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'type', t.q_type,
                        'solved', coalesce(c.solved, 0),
                        'total_available', t.total_available,
                        'accuracy', coalesce(c.accuracy, 0)
                    )
                    order by t.q_type
                ),
                '[]'::jsonb
            ) as qt

        from total_available_by_type t

        left join type_counts c
            on c.q_type = t.q_type
    )

    select jsonb_build_object(
        'total_unique_solved',
            coalesce(o.total_unique_solved, 0),

        'total_attempts',
            coalesce(o.total_attempts, 0),

        'overall_accuracy',
            coalesce(o.overall_accuracy, 0),

        'question_types',
            ta.qt

    )
    into v_global_stats

    from overall o
    cross join type_agg ta;

    return coalesce(
        v_global_stats,
        '{}'::jsonb
    );

end;
$$;

create or replace function internal_calc_recent_history(
    p_user_id uuid,
    p_version_number int
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_history jsonb;
begin

    with goal_subjects as (
        select distinct subject_id
        from internal_get_user_goal_subjects(p_user_id)
    ),

    recent_activity as (
        select
            uqa.*
        from public.user_question_activity uqa

        join public.questions q
            on q.id = uqa.question_id

        join goal_subjects gs
            on gs.subject_id = q.subject_id

        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number

        order by uqa.attempted_at desc

        limit 10
    )

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'question_id', ra.question_id,
                'question_text', q.question,
                'subject_name', s.name,
                'exam_year', q.year,
                'marks', q.marks,
                'question_type', q.question_type,
                'was_correct', ra.was_correct,
                'time_taken', ra.time_taken,
                'attempted_at', ra.attempted_at
            )
            order by ra.attempted_at desc
        ),
        '[]'::jsonb
    )
    into v_history

    from recent_activity ra

    join public.questions q
        on q.id = ra.question_id

    left join public.subjects s
        on s.id = q.subject_id;

    return v_history;

end;
$$;

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

    v_final_json jsonb;
begin
    -- --------------------------------------------------
    -- Base user profile
    -- --------------------------------------------------

    select
        version_number,
        total_xp,
        college,
        "targetYear",
        joined_at
    into v_user_data
    from public.users
    where id = p_user_id;

    if not found then
        raise exception 'User not found.';
    end if;


    -- --------------------------------------------------
    -- Target year
    -- --------------------------------------------------

    v_target_year := coalesce(
        v_user_data."targetYear",
        extract(year from now())::int + 1
    );


    -- --------------------------------------------------
    -- Calculate dashboard components
    --
    -- Each helper is responsible for restricting its
    -- result to the user's CURRENT active goal.
    -- --------------------------------------------------

    select *
    into v_streaks
    from internal_calc_user_streaks(
        p_user_id,
        v_user_data.version_number
    );

    v_heatmap := internal_calc_user_heatmap(
        p_user_id,
        v_user_data.version_number
    );

    v_exam_stats := internal_calc_exam_stats(
        p_user_id,
        v_user_data.version_number
    );

    v_global_stats := internal_calc_global_stats(
        p_user_id,
        v_user_data.version_number
    );

    v_recent_history := internal_calc_recent_history(
        p_user_id,
        v_user_data.version_number
    );


    -- --------------------------------------------------
    -- Dashboard dates
    -- --------------------------------------------------

    v_today_ist := (
        now() at time zone 'Asia/Kolkata'
    )::date;

    v_exam_date := make_date(
        v_target_year,
        2,
        7
    );

    v_completion_date := make_date(
        v_target_year,
        1,
        15
    );


    -- --------------------------------------------------
    -- Today's unique first-time questions
    --
    -- IMPORTANT:
    -- internal_get_user_goal_subjects() is the single
    -- source of truth for which subjects belong to the
    -- CURRENT goal.
    --
    -- This automatically handles:
    --   - branch-specific subjects
    --   - universal subjects
    --   - selected exams
    --   - optional subjects
    --   - future branch-specific rules
    -- --------------------------------------------------

    select count(distinct uqa.question_id)::int
    into v_today_attempts
    from public.user_question_activity uqa

    join public.questions q
        on q.id = uqa.question_id

    join internal_get_user_goal_subjects(p_user_id) goal_subjects
        on goal_subjects.subject_id = q.subject_id

    where uqa.user_id = p_user_id
      and uqa.user_version_number = v_user_data.version_number

      -- Attempt happened today in IST
      and (
          uqa.attempted_at at time zone 'Asia/Kolkata'
      )::date = v_today_ist

      -- Question must not have been attempted before today
      and not exists (
          select 1
          from public.user_question_activity prev_uqa
          where prev_uqa.user_id = p_user_id
            and prev_uqa.user_version_number = v_user_data.version_number
            and prev_uqa.question_id = uqa.question_id
            and (
                prev_uqa.attempted_at at time zone 'Asia/Kolkata'
            )::date < v_today_ist
      );


    -- --------------------------------------------------
    -- Combined question pool across the CURRENT
    -- target exams.
    --
    -- internal_calc_exam_stats() has already restricted
    -- every exam to the subjects belonging to the
    -- current goal.
    -- --------------------------------------------------

    select
        coalesce(
            sum((exam_data.value->>'total_available')::int),
            0
        ),
        coalesce(
            sum((exam_data.value->>'overall_attempted')::int),
            0
        )
    into
        v_total_available,
        v_total_solved
    from jsonb_each(v_exam_stats) as exam_data;


    -- --------------------------------------------------
    -- Calculate remaining questions
    -- --------------------------------------------------

    v_remaining_questions := greatest(
        0,
        v_total_available - v_total_solved
    );


    -- --------------------------------------------------
    -- Calculate daily pacing target
    -- --------------------------------------------------

    v_days_left_completion :=
        v_completion_date - v_today_ist;

    if v_days_left_completion > 0 then

        v_daily_target := ceil(
            v_remaining_questions::numeric
            / v_days_left_completion
        )::int;

    else

        v_daily_target := v_remaining_questions;

    end if;


    -- --------------------------------------------------
    -- Final dashboard payload
    -- --------------------------------------------------

    v_final_json := jsonb_build_object(

        'profile',
        jsonb_build_object(
            'total_xp',
            coalesce(v_user_data.total_xp, 0),

            'college',
            v_user_data.college,

            'targetYear',
            v_target_year,

            'current_version',
            v_user_data.version_number,

            'joined_at',
            v_user_data.joined_at
        ),

        'streaks',
        jsonb_build_object(
            'study_current',
            coalesce(v_streaks.study_current_streak, 0),

            'study_longest',
            coalesce(v_streaks.study_longest_streak, 0),

            'learning_current',
            coalesce(v_streaks.learning_current_streak, 0),

            'learning_longest',
            coalesce(v_streaks.learning_longest_streak, 0)
        ),

        'dashboard_stats',
        jsonb_build_object(
            'today_unique_attempt_count',
            coalesce(v_today_attempts, 0),

            'daily_question_target',
            coalesce(v_daily_target, 0),

            'days_left',
            greatest(
                0,
                v_exam_date - v_today_ist
            ),

            'is_target_met_today',
            coalesce(v_today_attempts, 0)
                >= coalesce(v_daily_target, 0),

            'today_progress_percent',
            case
                when coalesce(v_daily_target, 0) > 0
                then least(
                    100,
                    round(
                        coalesce(v_today_attempts, 0)
                        * 100.0
                        / nullif(v_daily_target, 0)
                    )::int
                )
                else 100
            end,

            'exam_date',
            v_exam_date
        ),

        'global_stats',
        v_global_stats,

        'heatmap',
        v_heatmap,

        'exam_stats',
        v_exam_stats,

        'recent_history',
        v_recent_history
    );


    return v_final_json;
end;
$$;

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

