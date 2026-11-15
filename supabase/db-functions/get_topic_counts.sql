create or replace function public.get_topic_counts (p_subject_id uuid)
    returns table (
        topic text,
        question_count bigint,
        unattempted_count bigint,
        subject_id uuid
    )
    as $$
declare
    v_user_version int;
begin
    select
        version_number
    into
        v_user_version
    from
        users
    where
        id = auth.uid ();
    return query
    select
        q.topic,
        COUNT(*) as question_count,
        COUNT(*) filter (where not exists (
            select
                1 from user_question_activity uqa where uqa.question_id = q.id
                and uqa.user_id = auth.uid ()
                and uqa.user_version_number = v_user_version)) as unattempted_count,
    p_subject_id as subject_id
from
    questions q
where
    q.subject_id = p_subject_id
        and q.topic is not null
        and q.verified = true
        and (q.metadata ->> 'mockId' is null
            or public.user_can_access_mock (q.metadata ->> 'mockId'))
    group by
        q.topic;
end;
$$
language plpgsql;

