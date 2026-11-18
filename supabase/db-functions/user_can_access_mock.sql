create or replace function public.user_can_access_mock (p_mock_id text)
    returns boolean
    language plpgsql
    stable
    security definer
    set search_path = 'public'
    as $$
declare
    v_has_completed boolean;
    v_mock_post_min_tier smallint;
    v_my_tier smallint;
begin
    if p_mock_id is null then
        return false;
    end if;
    v_my_tier := coalesce(public.get_my_tier (), 0);
    -- User must have a completed session for this mock
    select
        exists (
            select
                1
            from
                public.topic_tests
            where
                user_id = auth.uid ()
                and status = 'completed'
                and (paper_id = p_mock_id
                    or paper_id like p_mock_id || '-r%'
                    or paper_id like p_mock_id || '-practice-%'))
    into
        v_has_completed;
    if not v_has_completed then
        return false;
    end if;
    -- Read the mock's gate from the row. Fail closed if missing.
    select
        post_min_tier
    into
        v_mock_post_min_tier
    from
        public.mocks
    where
        id = p_mock_id;
    if v_mock_post_min_tier is null then
        return false;
    end if;
    return v_mock_post_min_tier = 0
        or v_my_tier >= v_mock_post_min_tier;
end;
$$;

