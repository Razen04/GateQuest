create or replace function generate_weekly_revision_set(
    p_valid_subjects uuid[],
    p_target_exams text[],
    p_branch_id text
)
returns json as $$
declare
    v_user_id uuid;
    v_set_id uuid;
    v_start_of_period date;
    v_questions_added int;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- calculate a 3-day epoch window boundary
    v_start_of_period := (
        to_timestamp(
            floor(extract(epoch from current_date) / (3 * 86400)) * (3 * 86400)
        )::date
    );

    -- check if a set already exists for this user/period/branch
    select id
    into v_set_id
    from weekly_revision_set
    where generated_for = v_user_id
      and start_of_week = v_start_of_period
      and branch_id = p_branch_id;

    if v_set_id is not null then
        return json_build_object(
            'success', true,
            'status', 'existing',
            'message', 'Set already present for this 3-day period.'
        );
    end if;

    -- create the revision set header
    insert into weekly_revision_set (
        generated_for,
        start_of_week,
        status,
        created_at,
        exam_tags,
        branch_id
    )
    values (
        v_user_id,
        v_start_of_period,
        'pending',
        now(),
        p_target_exams,
        p_branch_id
    )
    returning id into v_set_id;

    with rankedqueue as (
        select distinct on (uiq.question_id)
            uiq.question_id,
            uiq.box,
            uiq.added_at
        from user_incorrect_queue uiq
        join questions q on uiq.question_id = q.id
        join subjects s on q.subject_id = s.id
        cross join lateral jsonb_array_elements_text(
            case
                when jsonb_typeof(q.metadata->'exam') = 'array' then q.metadata->'exam'
                when q.metadata->'exam' is not null then jsonb_build_array(q.metadata->>'exam')
                else '[]'::jsonb
            end
        ) as expanded_tags(tag)
        where uiq.user_id = v_user_id
          and uiq.next_review_at <= now()
          and q.subject_id = any(p_valid_subjects)
          and q.verified = true
          and (
                s.is_universal = true
                or (
                    q.metadata->>'set' = upper(p_branch_id)
                    or expanded_tags.tag = any(p_target_exams)
                )
          )
    )
    insert into revision_set_questions (set_id, question_id)
    select
        v_set_id,
        question_id
    from rankedqueue
    order by box asc, added_at asc
    limit 30;

    get diagnostics v_questions_added = row_count;

    if v_questions_added = 0 then
        delete from weekly_revision_set
        where id = v_set_id;

        return json_build_object(
            'success', true,
            'status', 'empty',
            'message', 'No questions available for revision.'
        );
    end if;

    update weekly_revision_set
    set total_questions = v_questions_added
    where id = v_set_id;

    return json_build_object(
        'success', true,
        'status', 'created',
        'message', 'Generated new 3-day revision set.'
    );

exception
    when others then
        raise exception 'Failed to generate revision set: %', sqlerrm;
end;
$$ language plpgsql;
