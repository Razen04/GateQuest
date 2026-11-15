create or replace function public.fetch_practice_questions (p_subject_id uuid, p_last_fetched_at timestamptz default null)
    returns setof public.questions
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        *
    from
        public.questions
    where
        verified = true
        and subject_id = p_subject_id
        and (p_last_fetched_at is null
            or updated_at > p_last_fetched_at)
        and (metadata ->> 'mockId' is null
            or public.user_can_access_mock (metadata ->> 'mockId'));
$$;

