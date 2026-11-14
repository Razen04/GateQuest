create or replace function public.user_can_access_mock (p_mock_id text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = 'public'
    as $$
    select
        p_mock_id is not null
        and coalesce(public.get_my_tier (), 0) >= 1
        and exists (
            select
                1
            from
                public.topic_tests
            where
                user_id = auth.uid ()
                and status = 'completed'
                and (paper_id = p_mock_id
                    or paper_id like p_mock_id || '-r%'
                    or paper_id like p_mock_id || '-practice-%'));
$$;
