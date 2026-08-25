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
