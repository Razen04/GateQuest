create or replace function public.fetch_practice_questions (p_subject_id uuid, p_last_fetched_at timestamptz default null)
    returns setof public.questions
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        q.*
    from
        public.questions q
    where
        q.verified = true
        and q.subject_id = p_subject_id
        and (p_last_fetched_at is null
            or q.updated_at > p_last_fetched_at)
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
                        and public.user_can_access_mock (mq.mock_id)));
$$;

