create or replace function public.user_has_question_in_session (p_question_id uuid)
    returns boolean
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        exists (
            select
                1
            from
                public.topic_tests_attempts a
                join public.topic_tests t on t.id = a.session_id
            where
                a.question_id = p_question_id
                and t.user_id = auth.uid ());
$$;

