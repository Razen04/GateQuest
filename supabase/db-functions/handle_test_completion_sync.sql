create or replace function public.handle_test_completion_sync ()
    returns trigger
    language plpgsql
    security definer
    as $$
begin
    -- Only run when status changes to 'completed'
    if new.status = 'completed' and old.status <> 'completed' and new.record_activity is true then
        -- ACTIVITY LOG
        insert into public.user_question_activity (user_id, question_id, subject, subject_id, branch_id, user_version_number, was_correct, time_taken, attempted_at, attempt_number)
        select
            new.user_id,
            a.question_id,
            q.subject,
            q.subject_id,
            new.branch_id,
            (
                select
                    version_number
                from
                    public.users
                where
                    id = new.user_id), a.is_correct, a.time_spent_seconds, NOW(), (
                select
                    COALESCE(MAX(attempt_number), 0) + 1
                from
                    public.user_question_activity uqa
                where
                    uqa.user_id = new.user_id
                    and uqa.question_id = a.question_id)
        from
            public.topic_tests_attempts a
            join public.questions q on q.id = a.question_id
        where
            a.session_id = new.id
            and a.user_answer is not null;
        -- INCORRECT ANSWERS
        insert into public.user_incorrect_queue (user_id, question_id, box, added_at, next_review_at)
        select
            new.user_id,
            a.question_id,
            1,
            NOW(),
            NOW()
        from
            public.topic_tests_attempts a
        where
            a.session_id = new.id
            and COALESCE(a.is_correct, false) = false
        on conflict (user_id,
            question_id)
            do update set
                box = 1,
                next_review_at = NOW() + interval '1 week';
        -- CORRECT ANSWERS → GRADUATE
        -- Graduate box 3
        delete from public.user_incorrect_queue q using public.topic_tests_attempts a
        where q.user_id = new.user_id
            and q.question_id = a.question_id
            and a.session_id = new.id
            and a.is_correct is true
            and q.box = 3;
    -- Promote box 1 → 2, box 2 → 3
    update
        public.user_incorrect_queue q
    set
        box = q.box + 1,
        next_review_at = case when q.box = 1 then
            NOW() + interval '2 weeks'
        when q.box = 2 then
            NOW() + interval '4 weeks'
        else
            q.next_review_at
        end
    from
        public.topic_tests_attempts a
    where
        q.user_id = new.user_id
        and q.question_id = a.question_id
        and a.session_id = new.id
        and a.is_correct is true
        and q.box in (1, 2);
end if;
    return NEW;
end;
$$;
