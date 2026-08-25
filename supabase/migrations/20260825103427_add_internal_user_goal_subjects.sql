create or replace function internal_get_user_goal_subjects(
    p_user_id uuid
)
returns table (
    subject_id uuid
)
language sql
security definer
stable
as $$
    with active_goal as (
        select
            branch_id,
            target_exams,
            additional_subjects
        from public.user_goals
        where user_id = p_user_id
          and is_active = true
        limit 1
    ),

    target_exam_ids as (
        select lower(exam_id) as exam_id
        from active_goal ag
        cross join lateral jsonb_array_elements_text(
            ag.target_exams
        ) as exams(exam_id)
    ),

    /*
     * GATE-XL:
     *
     * The goal consists ONLY of:
     *   1. General Aptitude
     *   2. Chemistry
     *   3. The user's explicitly selected additional subjects
     */
    xl_subjects as (
        select s.id as subject_id
        from public.subjects s
        where s.slug in (
            'aptitude',
            'chemistry'
        )

        union

        select extra.subject_id
        from active_goal ag
        cross join lateral unnest(
            coalesce(
                ag.additional_subjects,
                '{}'::uuid[]
            )
        ) as extra(subject_id)
    ),

    /*
     * Normal goals:
     *
     * Universal subjects OR subjects mapped to the
     * user's branch, provided they belong to a target exam.
     */
    normal_subjects as (
        select distinct
            s.id as subject_id
        from active_goal ag
        join target_exam_ids te
            on true
        join public.exams_subjects es
            on lower(es.exams_id) = te.exam_id
        join public.subjects s
            on s.id = es.subject_id
        left join public.branch_subjects bs
            on bs.subject_id = s.id
           and lower(bs.branch_id) = lower(ag.branch_id)
        where
            s.is_universal = true
            or bs.subject_id is not null
    )

    /*
     * Select the appropriate subject set for the active goal.
     */
    select xs.subject_id
    from xl_subjects xs
    where exists (
        select 1
        from active_goal ag
        where lower(ag.branch_id) = 'xl'
          and exists (
              select 1
              from target_exam_ids te
              where te.exam_id = 'gate'
          )
    )

    union

    select ns.subject_id
    from normal_subjects ns
    where not exists (
        select 1
        from active_goal ag
        where lower(ag.branch_id) = 'xl'
          and exists (
              select 1
              from target_exam_ids te
              where te.exam_id = 'gate'
          )
    );
$$;

