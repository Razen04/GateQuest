create or replace function public.get_exam_subject_counts (target_exams text[])
    returns table (
        subject_id uuid,
        exam_specific_count bigint
    )
    as $$
begin
    return query
    select
        q.subject_id,
        COUNT(distinct q.id) as exam_specific_count
    from
        questions q
        join subjects s on q.subject_id = s.id
        cross join lateral jsonb_array_elements_text(
            case when jsonb_typeof(q.metadata -> 'exam') = 'array' then
                q.metadata -> 'exam'
            when q.metadata -> 'exam' is not null then
                jsonb_build_array(q.metadata ->> 'exam')
            else
                '["GATE"]'::jsonb
            end) as expanded_tags (tag)
where (s.is_universal = true
        or expanded_tags.tag = any (target_exams))
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
            q.subject_id;
end;
$$
language plpgsql;

