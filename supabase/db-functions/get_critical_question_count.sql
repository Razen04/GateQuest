create or replace function public.get_critical_question_count (p_valid_subjects uuid[])
    returns integer
    as $$
declare
    v_count integer;
    v_current_branch_id text;
begin
    select
        branch_id
    into
        v_current_branch_id
    from
        public.user_goals
    where
        user_id = auth.uid ()
    limit 1;
    select
        COUNT(distinct uiq.question_id)
    into
        v_count
    from
        user_incorrect_queue uiq
        join questions q on uiq.question_id = q.id
        join subjects s on q.subject_id = s.id
    where
        uiq.user_id = auth.uid ()
        and uiq.next_review_at <= NOW()
        and q.subject_id = any (p_valid_subjects)
        and q.verified = true
        and (s.is_universal = true
            or (q.metadata ->> 'set' = UPPER(v_current_branch_id)))
        and (q.metadata ->> 'mockId' is null
            or public.user_can_access_mock (q.metadata ->> 'mockId'));
    return v_count;
end;
$$
language plpgsql;

