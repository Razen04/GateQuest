create or replace function public.refresh_closed_mock_stats ()
    returns integer
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_mock record;
    v_question_ids uuid[];
    v_count integer := 0;
    v_refreshed boolean := false;
begin
    for v_mock in
    select
        m.id
    from
        public.mocks m
    where
        m.starts_at + make_interval(secs => m.duration_seconds) <= now()
        and (m.peer_stats_refreshed_at is null
            or m.peer_stats_refreshed_at < m.starts_at + make_interval(secs => m.duration_seconds))
    order by
        m.starts_at
    for update
        skip locked
    loop
        select
            array_agg(distinct a.question_id)
        into
            v_question_ids
        from
            public.topic_tests t
            join public.topic_tests_attempts a on a.session_id = t.id
        where
            (t.paper_id = v_mock.id
                or t.paper_id like v_mock.id || '-r%')
            and t.paper_id not like '%-practice-%';

        begin
            perform
                public.refresh_question_peer_stats_for_questions (coalesce(v_question_ids, '{}'::uuid[]));

            update
                public.mocks
            set
                peer_stats_refreshed_at = now()
            where
                id = v_mock.id;

            v_count := v_count + 1;
            v_refreshed := true;
        exception
            when others then
                -- One bad mock must not stall the others.
                raise warning 'refresh_closed_mock_stats failed for %: %', v_mock.id, sqlerrm;
        end;
    end loop;

    -- Donor mock attempts land in user_question_activity when the session
    -- completes, so the materialized difficulty view is stale until the
    -- nightly sync. Fold it in now that the window is closed.
    if v_refreshed then
        perform
            public.refresh_dynamic_difficulty ();
    end if;

    return v_count;
end;
$$;

comment on function public.refresh_closed_mock_stats () is
'Refreshes question_peer_stats and dynamic difficulty for mocks whose window has closed. Cron-only.';

revoke all on function public.refresh_closed_mock_stats () from public;

revoke all on function public.refresh_closed_mock_stats () from anon, authenticated;

grant execute on function public.refresh_closed_mock_stats () to service_role;
