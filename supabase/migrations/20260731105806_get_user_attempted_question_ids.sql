create or replace function get_user_attempted_ids(
    p_subject_slug text default null,
    p_mode text default 'practice'
)
returns table (question_id uuid)
language plpgsql
security definer
as $$
declare
    v_user_id uuid := auth.uid();
    v_version_number int;
    v_active_set_id uuid;
begin
    if p_mode = 'revision' then
        -- Find the currently active weekly revision set for the user
        select id into v_active_set_id
        from public.weekly_revision_set
        where generated_for = v_user_id
          and status in ('started', 'pending')
        order by created_at desc
        limit 1;

        if v_active_set_id is null then
            return;
        end if;

        -- Return question_ids from the active set that have been answered (is_correct is not null)
        return query
        select rsq.question_id
        from public.revision_set_questions rsq
        join public.questions q on rsq.question_id = q.id
        left join public.subjects s on q.subject_id = s.id
        where rsq.set_id = v_active_set_id
          and rsq.is_correct is not null
          and (p_subject_slug is null or s.slug = p_subject_slug);

    else
        -- Practice Mode: Standard unique attempted questions for user's active version
        select version_number into v_version_number
        from public.users
        where id = v_user_id;

        return query
        select distinct uqa.question_id
        from public.user_question_activity uqa
        join public.questions q on uqa.question_id = q.id
        join public.subjects s on q.subject_id = s.id
        where uqa.user_id = v_user_id
          and uqa.user_version_number = v_version_number
          and (p_subject_slug is null or s.slug = p_subject_slug);
    end if;
end;
$$;
