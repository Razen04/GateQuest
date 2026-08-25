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
