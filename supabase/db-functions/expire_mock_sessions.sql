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
        join public.mocks m on t.paper_id = m.id
            or t.paper_id like m.id || '-r%'
    where
        t.paper_id like 'mock-%'
        and t.paper_id not like '%-practice-%'
        and t.status <> 'completed'
        and now() >= m.starts_at + make_interval(secs => m.duration_seconds)
    for update
        of t skip locked loop
            begin
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
                    raise WARNING 'expire_mock_sessions failed for %: %', v_session.id, SQLERRM;
            end;
    end loop;
    return v_count;
end;

$$;

