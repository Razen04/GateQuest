create or replace function public.get_user_bookmarks(
    p_subject_slug text default null
)
returns table (
    question_id uuid,
    notes text,
    created_at timestamptz,
    question text,
    subject_id uuid,
    subject_slug text,
    subject_name text,
    topic text,
    question_type text,
    difficulty text
)
language plpgsql
security invoker
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'Authentication required.';
    end if;

    return query
    select
        qb.question_id,
        qb.notes,
        qb.created_at,
        q.question,
        s.id as subject_id,
        s.slug as subject_slug,
        s.name as subject_name,
        q.topic,
        q.question_type,
        q.difficulty
    from question_bookmarks qb
    join questions q
        on q.id = qb.question_id
    join subjects s
        on s.id = q.subject_id
    where qb.user_id = v_user_id
      and (
          p_subject_slug is null
          or s.slug = p_subject_slug
      )
    order by qb.created_at desc;
end;
$$;
