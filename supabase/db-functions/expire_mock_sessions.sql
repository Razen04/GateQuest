create or replace function public.expire_mock_sessions ()
    returns int
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_session record;
    v_count int := 0;
    v_attempts jsonb;
begin
    for v_session in
    select
        t.id
    from
        public.topic_tests t
    where
        t.paper_id like 'mock-%'
        and t.paper_id not like '%-practice-%'
        and t.status <> 'completed'
        and exists (
            select
                1
            from
                public.questions q
            where
                q.metadata ->> 'mockId' = regexp_replace(t.paper_id, '-r[0-9]+$', '')
                and now() >= (q.metadata ->> 'mockStartsAt')::timestamptz + make_interval(secs => (q.metadata ->> 'mockDurationSeconds')::int))
            loop
                begin
                    -- Collect current attempts from the DB (server's view, not
                    -- the client's). The heartbeat writes every 60s, so a user
                    -- who vanishes loses at most the final minute of answers.
                    select
                        coalesce(jsonb_agg(jsonb_build_object('question_id', a.question_id, 'user_answer', a.user_answer, 'marked_for_review', a.marked_for_review, 'status', a.status, 'time_spent_seconds', a.time_spent_seconds, 'attempt_order', a.attempt_order)), '[]'::jsonb)
                    into
                        v_attempts
                    from
                        public.topic_tests_attempts a
                    where
                        a.session_id = v_session.id;
                    perform
                        public.submit_test_grading (v_session.id, v_attempts, 0);
                    -- Belt-and-suspenders: if submit_test_grading didn't flip
                    -- status to 'completed', do it here. A second cron cycle
                    -- would otherwise re-process the same session forever.
                    update
                        public.topic_tests
                    set
                        status = 'completed'
                    where
                        id = v_session.id
                        and status <> 'completed';
                    v_count := v_count + 1;
                exception
                    when others then
                        -- One failed session doesn't abort the batch
                        raise WARNING 'expire_mock_sessions failed for %: %', v_session.id, SQLERRM;
                end;
    end loop;
    return v_count;
end;

$$;

