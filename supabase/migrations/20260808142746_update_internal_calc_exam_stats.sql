-- now only first attempts will be considered which fixes issue [#94](https://github.com/Razen04/GateQuest/issues/94)

create or replace function internal_calc_exam_stats(p_user_id uuid, p_version_number int)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_final_stats jsonb;
    v_branch_id text;
begin
    -- extract user branch
    select lower(branch_id)
    into v_branch_id
    from public.user_goals
    where user_id = p_user_id
      and is_active = true
    limit 1;

    with user_target_exams as (
        select distinct
            lower(te.exam_id) as exam_id
        from public.user_goals ug
        cross join jsonb_array_elements_text(ug.target_exams) as te(exam_id)
        where ug.user_id = p_user_id
          and ug.is_active = true
    ),
    -- fetch valid subjects per target exam
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
        join public.subjects s
            on es.subject_id = s.id
        left join public.branch_subjects bs
            on bs.subject_id = s.id
        where (
            s.is_universal = true
            or bs.branch_id is null
            or lower(bs.branch_id) = coalesce(v_branch_id, lower(bs.branch_id))
        )
    ),
    -- calculate total available questions dynamically from questions table per exam
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
    -- calculate user first-attempt stats per exam & subject
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
            on uqa.question_id = q.id
        join exam_subjects es
            on es.subject_id = q.subject_id
        where uqa.user_id = p_user_id
          and uqa.user_version_number = p_version_number
          and uqa.attempt_number = 1 -- strictly first attempts only
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
    -- combine and build per-subject json array
    exam_agg as (
        select
            es.exam_id,
            jsonb_agg(
                jsonb_build_object(
                    'subject_name', es.subject_name,
                    'subject_slug', es.subject_slug,
                    'icon_name', es.icon_name,
                    'theme_color', es.theme_color,
                    'attempted', coalesce(sa.attempted, 0),
                    'correct', coalesce(sa.correct, 0),
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
                    'total_available', coalesce(eqc.available_count, 0),
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
            ) as subjects_array,
            sum(coalesce(eqc.available_count, 0))::int as total_available,
            sum(coalesce(sa.attempted, 0))::int as overall_attempted,
            sum(coalesce(sa.correct, 0))::int as overall_correct
        from exam_subjects es
        left join exam_question_counts eqc
            on es.exam_id = eqc.exam_id
            and es.subject_id = eqc.subject_id
        left join subject_activity sa
            on es.exam_id = sa.exam_id
            and es.subject_id = sa.subject_id
        group by es.exam_id
    )
    -- build root json map for exams
    select jsonb_object_agg(
        ea.exam_id,
        jsonb_build_object(
            'overall_attempted', coalesce(ea.overall_attempted, 0),
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
            'total_available', coalesce(ea.total_available, 0),
            'subjects', coalesce(ea.subjects_array, '[]'::jsonb)
        )
    )
    into v_final_stats
    from exam_agg ea;

    return coalesce(v_final_stats, '{}'::jsonb);
end;
$$;
