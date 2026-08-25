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
