create or replace function public.get_topic_counts (p_subject_id uuid)
    returns table (
        topic text,
        question_count bigint,
        unattempted_count bigint,
        subject_id uuid)
    language plpgsql
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
        and (not exists (
                select
                    1
                from
                    public.mock_questions mq
                where
                    mq.question_id = q.id)
                or exists (
                    select
                        1
                    from
                        public.mock_questions mq
                    where
                        mq.question_id = q.id
                        and public.user_can_access_mock (mq.mock_id)))
        group by
            q.topic;
end;
$$;

